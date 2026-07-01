// supabase/functions/import-medicamentos/index.ts
//
// Importa a base de medicamentos da CMED/ANVISA para a tabela "medicamentos".
//
// LEITURA EM STREAMING: o arquivo e um CSV (export da planilha CMED) lido
// linha a linha, sem carregar tudo em memoria, para nao estourar o limite de
// RAM da edge function (o arquivo grande estourava com WORKER_RESOURCE_LIMIT).
//
// O arquivo deve estar no bucket privado "fontes-oficiais" com o nome em OBJECT.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

const BUCKET = "fontes-oficiais"
const OBJECT = "anvisa/xls_conformidade_site_20260610_121627707 - Planilha1.csv"

// Indices das colunas na base CMED (mesma ordem da planilha original).
const COL = {
  substancia: 0,
  laboratorio: 2,
  registro: 4,
  ean1: 5,
  produto: 8,
  apresentacao: 9,
  classe: 10,
  tipo: 11,
  comercializacao: 71,
  tarja: 72,
}

function mapTipo(t: string): "generico" | "similar" | "referencia" {
  const c = (t || "").trim().toLowerCase()
  if (c.includes("gen")) return "generico"
  if (c.includes("similar")) return "similar"
  return "referencia"
}

function isControlado(tarja: string): boolean {
  const t = (tarja || "").toLowerCase()
  return t.includes("preta") || t.includes("restri")
}

// Converte a apresentacao "crua" da CMED em algo legivel na receita.
// Ex.: "500 MG COM REV CT BL AL PLAS PVDC OPC X 20" -> "500 mg comprimido revestido"
// Mantem a concentracao e a forma farmaceutica; descarta a embalagem.
const FORMAS: Array<[RegExp, string]> = [
  [/\bCOM\s+REV\b/, "comprimido revestido"],
  [/\bCOM\s+EFERV\b/, "comprimido efervescente"],
  [/\bCOM\b/, "comprimido"],
  [/\bCPR\b/, "comprimido"],
  [/\bCAP\b/, "capsula"],
  [/\bDRG\b/, "dragea"],
  [/\bSOL\s+INJ\b/, "solucao injetavel"],
  [/\bSOL\s+OR\b/, "solucao oral"],
  [/\bSOL\b/, "solucao"],
  [/\bSUS\s+OR\b/, "suspensao oral"],
  [/\bSUS\b/, "suspensao"],
  [/\bXPE\b/, "xarope"],
  [/\bGEL\b/, "gel"],
  [/\bPOM\b/, "pomada"],
  [/\bCREM?\b/, "creme"],
  [/\bGTS?\b/, "gotas"],
  [/\bSPRAY\b/, "spray"],
  [/\bAER\b/, "aerossol"],
  [/\bPO\b/, "po"],
]

function limpaApresentacao(raw: string): string {
  let up = (raw || "").toUpperCase().trim()
  if (!up) return ""
  up = up.replace(/[()]/g, " ").replace(/\s+/g, " ").trim()
  // Concentracao: numeros/"+"/"," iniciais seguidos de unidade (MG, G, MG/ML, UI...).
  const concMatch = up.match(
    /([\d.,+\s]*[\d.,]+\s*(?:MG|G|MCG|UI|ML)(?:\s*\/\s*[\d.,]*\s*(?:MG|G|MCG|ML|DOSE|UI|H))?)/,
  )
  const conc = concMatch ? concMatch[1].replace(/\s+/g, " ").trim() : ""
  // Forma farmaceutica: primeira que casar.
  let forma = ""
  for (const [re, nome] of FORMAS) {
    if (re.test(up)) { forma = nome; break }
  }
  const partes = [conc.toLowerCase(), forma].filter(Boolean)
  // Fallback: se nao achou nada, devolve os primeiros termos crus.
  if (partes.length === 0) return up.split(/\s+/).slice(0, 4).join(" ").toLowerCase()
  return partes.join(" ")
}

function limpaLab(v: string): string {
  return (v || "").trim()
}

// Detecta o separador (";" ou ",") a partir de uma linha de cabecalho.
function detectSep(headerLine: string): string {
  const semi = (headerLine.match(/;/g) || []).length
  const comma = (headerLine.match(/,/g) || []).length
  return semi > comma ? ";" : ","
}

// Faz o parse de UMA linha CSV respeitando aspas duplas ("...", com "" escapado).
function parseCsvLine(line: string, sep: string): string[] {
  const out: string[] = []
  let cur = ""
  let inQ = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQ) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++ }
        else inQ = false
      } else cur += ch
    } else {
      if (ch === '"') inQ = true
      else if (ch === sep) { out.push(cur); cur = "" }
      else cur += ch
    }
  }
  out.push(cur)
  return out.map((c) => c.trim())
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS })

  const started = Date.now()
  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    )

    const { data: file, error: dlErr } = await admin.storage
      .from(BUCKET)
      .download(OBJECT)
    if (dlErr || !file) {
      throw new Error(
        `Nao foi possivel ler a base (${BUCKET}/${OBJECT}): ${dlErr?.message ?? "arquivo ausente"}`,
      )
    }

    // Le em streaming: decodifica por chunk e emite registros completos
    // (respeitando aspas que possam conter quebras de linha internas).
    const reader = (file.stream() as ReadableStream<Uint8Array>).getReader()
    const decoder = new TextDecoder("utf-8")

    let sep = ","
    let headerFound = false
    let carry = ""
    let inQ = false

    let total = 0
    let importados = 0
    let ignorados = 0
    const erros: string[] = []
    let batch: Record<string, unknown>[] = []

    async function flush() {
      if (batch.length === 0) return
      const { error } = await admin
        .from("medicamentos")
        .upsert(batch, { onConflict: "registro,produto", ignoreDuplicates: false })
      if (error) {
        if (erros.length < 20) erros.push(error.message)
      } else {
        importados += batch.length
      }
      batch = []
    }

    // Processa uma linha logica (registro CSV ja completo).
    async function handleRecord(recordText: string) {
      if (!headerFound) {
        // A primeira linha que contiver SUBST e APRESENTA e o cabecalho.
        const upper = recordText.toUpperCase()
        if (upper.includes("SUBST") && upper.includes("APRESENTA")) {
          sep = detectSep(recordText)
          headerFound = true
        }
        return
      }
      const cells = parseCsvLine(recordText, sep)
      if (cells.length < 12) { ignorados++; return }
      const produto = (cells[COL.produto] || "").trim()
      const registro = (cells[COL.registro] || "").trim()
      if (!produto) { ignorados++; return }
      total++
      const tarja = cells[COL.tarja] || ""
      batch.push({
        produto,
        substancia: (cells[COL.substancia] || "").trim() || null,
        apresentacao: limpaApresentacao(cells[COL.apresentacao] || "") || null,
        laboratorio: limpaLab(cells[COL.laboratorio] || "") || null,
        classe_terapeutica: (cells[COL.classe] || "").trim() || null,
        tipo: mapTipo(cells[COL.tipo] || ""),
        tarja: tarja.trim() || null,
        controlado: isControlado(tarja),
        registro: registro || null,
        situacao: (cells[COL.comercializacao] || "").trim() || null,
      })
      if (batch.length >= 500) await flush()
    }

    // Le chunk a chunk; separa registros em quebras de linha que NAO estejam
    // dentro de aspas. Assim campos com "\n" interno nao quebram o registro.
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      carry += decoder.decode(value, { stream: true })
      let start = 0
      for (let i = 0; i < carry.length; i++) {
        const ch = carry[i]
        if (ch === '"') inQ = !inQ
        else if (ch === "\n" && !inQ) {
          let rec = carry.slice(start, i)
          if (rec.endsWith("\r")) rec = rec.slice(0, -1)
          start = i + 1
          if (rec.length > 0) await handleRecord(rec)
        }
      }
      carry = carry.slice(start)
    }
    // Ultimo registro remanescente (sem quebra final).
    carry += decoder.decode()
    if (carry.trim().length > 0) await handleRecord(carry.replace(/\r$/, ""))
    await flush()

    const secs = ((Date.now() - started) / 1000).toFixed(1)
    return new Response(
      JSON.stringify({
        ok: true,
        headerFound,
        separador: sep,
        totalLidos: total,
        importados,
        ignorados,
        erros,
        segundos: secs,
      }),
      { headers: { ...CORS, "Content-Type": "application/json" } },
    )
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: String((e as Error)?.message ?? e) }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } },
    )
  }
})
