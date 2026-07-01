// Importa a base oficial de PREÇOS DE MEDICAMENTOS da CMED/ANVISA.
// Esta base traz a coluna APRESENTAÇÃO com a concentração (mg/g/mL),
// o princípio ativo (SUBSTÂNCIA), o nome comercial (PRODUTO), a tarja
// e a classe terapêutica de todos os medicamentos comercializados no Brasil.
//
// O arquivo XLSX (ex.: "xls_conformidade_site_AAAAMMDD.xlsx") deve ser
// baixado do portal da Anvisa (www.gov.br/anvisa/.../cmed/precos) e enviado
// para o bucket privado "fontes-oficiais" com o nome definido em OBJECT.
// A Anvisa tem cadeia de certificado incompleta e não pode ser baixada
// diretamente pelo Deno, por isso lemos do armazenamento do Supabase.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BUCKET = "fontes-oficiais";
const OBJECT = "anvisa/xls_conformidade_site_20260610_121627707.xlsx";

// Índice das colunas na planilha da CMED (cabeçalho detectado em runtime).
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
};

function mapTipo(t: string): "generico" | "similar" | "referencia" {
  const c = (t || "").trim().toLowerCase();
  if (c.includes("gen")) return "generico";
  if (c.includes("similar")) return "similar";
  return "referencia";
}

function isControlado(tarja: string): boolean {
  const t = (tarja || "").toLowerCase();
  return t.includes("preta") || t.includes("restri");
}

// Converte a apresentação "crua" da CMED em algo legível na receita.
// Ex.: "500 MG COM REV CT BL AL PLAS PVDC OPC X 20" -> "500 mg comprimido revestido"
// Mantém a concentração e a forma farmacêutica; descarta a embalagem.
const FORMAS: Array<[RegExp, string]> = [
  [/\bCOM\s+REV\b/, "comprimido revestido"],
  [/\bCOM\s+EFERV\b/, "comprimido efervescente"],
  [/\bCOM\b/, "comprimido"],
  [/\bCPR\b/, "comprimido"],
  [/\bCAP\b/, "cápsula"],
  [/\bDRG\b/, "drágea"],
  [/\bSOL\s+INJ\b/, "solução injetável"],
  [/\bSOL\s+OR\b/, "solução oral"],
  [/\bSOL\b/, "solução"],
  [/\bSUS\s+OR\b/, "suspensão oral"],
  [/\bSUS\b/, "suspensão"],
  [/\bXPE\b/, "xarope"],
  [/\bGEL\b/, "gel"],
  [/\bPOM\b/, "pomada"],
  [/\bCREM?\b/, "creme"],
  [/\bGTS?\b/, "gotas"],
  [/\bSPRAY\b/, "spray"],
  [/\bAER\b/, "aerossol"],
  [/\bPO\b/, "pó"],
];

function limpaApresentacao(raw: string): string {
  let up = (raw || "").toUpperCase().trim();
  if (!up) return "";
  up = up.replace(/[()]/g, " ").replace(/\s+/g, " ").trim();
  // Concentração: números/"+"/"," iniciais seguidos de unidade (MG, G, MG/ML, %, UI...).
  const concMatch = up.match(
    /^([\d.,+\s]*[\d.,]+\s*(?:MG|G|MCG|UI|%|ML)(?:\s*\/\s*[\d.,]*\s*(?:MG|G|MCG|ML|DOSE|UI|H))?)/,
  );
  const conc = concMatch ? concMatch[1].replace(/\s+/g, " ").trim() : "";
  // Forma farmacêutica: primeira que casar.
  let forma = "";
  for (const [re, nome] of FORMAS) {
    if (re.test(up)) { forma = nome; break; }
  }
  const partes = [conc.toLowerCase(), forma].filter(Boolean);
  // Fallback: se não achou nada, devolve os primeiros termos crus.
  if (partes.length === 0) return up.split(/\s+/).slice(0, 4).join(" ").toLowerCase();
  return partes.join(" ");
}

function limpaLab(v: string): string {
  return (v || "").trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  const started = Date.now();
  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: file, error: dlErr } = await admin.storage
      .from(BUCKET)
      .download(OBJECT);
    if (dlErr || !file) {
      throw new Error(
        `Não foi possível ler a base da CMED (${BUCKET}/${OBJECT}): ${dlErr?.message ?? "arquivo ausente"}`,
      );
    }

    const buf = new Uint8Array(await file.arrayBuffer());
    const wb = XLSX.read(buf, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const aoa = XLSX.utils.sheet_to_json<string[]>(ws, {
      header: 1,
      defval: "",
      raw: false,
    });

    // Detecta a linha de cabeçalho (com SUBSTÂNCIA e APRESENTAÇÃO preenchidos).
    let hdrIdx = -1;
    for (let i = 0; i < Math.min(aoa.length, 80); i++) {
      const row = (aoa[i] || []).map((c) => String(c).toUpperCase());
      const nonEmpty = row.filter((c) => c.trim() !== "").length;
      if (nonEmpty > 40 && row.some((c) => c.includes("APRESENT")) && row.some((c) => c.includes("SUBST"))) {
        hdrIdx = i;
        break;
      }
    }
    if (hdrIdx < 0) throw new Error("Cabeçalho da planilha CMED não encontrado.");

    const dataRows = aoa.slice(hdrIdx + 1);

    const seen = new Set<string>();
    const registros: Record<string, unknown>[] = [];
    let ignorados = 0;

    for (const r of dataRows) {
      const produto = String(r[COL.produto] ?? "").trim();
      const registro = String(r[COL.registro] ?? "").trim();
      const comercializacao = String(r[COL.comercializacao] ?? "").trim().toLowerCase();

      // Só medicamentos com nome e efetivamente comercializados.
      if (!produto || comercializacao === "não" || comercializacao === "nao") {
        ignorados++;
        continue;
      }

      const key = `${registro}||${produto}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const tarjaRaw = String(r[COL.tarja] ?? "");
      const tarja = tarjaRaw.replace(/^tarja/i, "").trim();

      registros.push({
        produto,
        substancia: String(r[COL.substancia] ?? "").trim() || null,
        apresentacao: limpaApresentacao(String(r[COL.apresentacao] ?? "")) || null,
        laboratorio: limpaLab(String(r[COL.laboratorio] ?? "")) || null,
        classe_terapeutica: String(r[COL.classe] ?? "").trim() || null,
        tipo: mapTipo(String(r[COL.tipo] ?? "")),
        tarja: tarja || null,
        controlado: isControlado(tarjaRaw),
        registro: registro || null,
        situacao: "Comercializado",
      });
    }

    let importados = 0;
    const erros: string[] = [];
    const BATCH = 500;
    for (let i = 0; i < registros.length; i += BATCH) {
      const slice = registros.slice(i, i + BATCH);
      const { error } = await admin
        .from("medicamentos")
        .upsert(slice, { onConflict: "registro,produto", ignoreDuplicates: false });
      if (error) {
        erros.push(`Lote ${i / BATCH + 1}: ${error.message}`);
      } else {
        importados += slice.length;
      }
    }

    return new Response(
      JSON.stringify({
        ok: erros.length === 0,
        fonte: "CMED/ANVISA — Lista de Preços de Medicamentos",
        total_linhas: dataRows.length,
        importados,
        ignorados,
        erros,
        duracao_ms: Date.now() - started,
      }),
      { headers: { ...CORS, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, erro: (e as Error).message }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } },
    );
  }
});
