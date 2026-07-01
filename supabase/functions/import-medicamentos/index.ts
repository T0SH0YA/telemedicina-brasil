// Importa a base oficial de MEDICAMENTOS da ANVISA (DADOS_ABERTOS_MEDICAMENTOS.csv)
// O arquivo é lido do bucket privado "fontes-oficiais" (a ANVISA tem cadeia de
// certificado incompleta e não pode ser baixada diretamente pelo Deno).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { parse } from "https://deno.land/std@0.224.0/csv/parse.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BUCKET = "fontes-oficiais";
const OBJECT = "anvisa/DADOS_ABERTOS_MEDICAMENTOS.csv";

function mapTipo(cat: string): "generico" | "similar" | "referencia" {
  const c = (cat || "").trim().toLowerCase();
  if (c === "genérico" || c === "generico") return "generico";
  if (c === "similar") return "similar";
  return "referencia";
}

function limpaLab(v: string): string {
  // "73663650000190 - RANBAXY FARMACÊUTICA LTDA" -> "RANBAXY FARMACÊUTICA LTDA"
  const idx = v.indexOf(" - ");
  return (idx >= 0 ? v.slice(idx + 3) : v).trim();
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
        `Não foi possível ler a base da ANVISA no armazenamento: ${dlErr?.message ?? "arquivo ausente"}`,
      );
    }

    const buf = await file.arrayBuffer();
    const text = new TextDecoder("iso-8859-1").decode(buf);
    const rows = parse(text, { separator: ";", lazyQuotes: true }) as string[][];

    // header: TIPO_PRODUTO;NOME_PRODUTO;DATA_FINALIZACAO_PROCESSO;CATEGORIA_REGULATORIA;
    // NUMERO_REGISTRO_PRODUTO;DATA_VENCIMENTO_REGISTRO;NUMERO_PROCESSO;CLASSE_TERAPEUTICA;
    // EMPRESA_DETENTORA_REGISTRO;SITUACAO_REGISTRO;PRINCIPIO_ATIVO
    const dataRows = rows.slice(1).filter((r) => r.length >= 11);

    // Dedup por (registro, produto) para evitar conflito no mesmo lote
    const seen = new Set<string>();
    const registros: Record<string, unknown>[] = [];
    let ignorados = 0;

    for (const r of dataRows) {
      const tipoProduto = (r[0] || "").trim();
      const situacao = (r[9] || "").trim();
      if (tipoProduto !== "MEDICAMENTO" || situacao !== "Ativo") {
        ignorados++;
        continue;
      }
      const produto = (r[1] || "").trim();
      const registro = (r[4] || "").trim();
      if (!produto) {
        ignorados++;
        continue;
      }
      const key = `${registro}||${produto}`;
      if (seen.has(key)) continue;
      seen.add(key);

      registros.push({
        produto,
        substancia: (r[10] || "").trim() || null,
        laboratorio: limpaLab(r[8] || "") || null,
        classe_terapeutica: (r[7] || "").trim() || null,
        categoria_regulatoria: (r[3] || "").trim() || null,
        tipo: mapTipo(r[3] || ""),
        registro: registro || null,
        situacao: situacao || null,
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
        fonte: "ANVISA — DADOS_ABERTOS_MEDICAMENTOS",
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
