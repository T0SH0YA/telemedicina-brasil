// Importa a base oficial do CID-10 (DATASUS v2008) a partir do espelho em CSV no GitHub.
// Categorias (3 dígitos) + Subcategorias (4 dígitos) + Capítulos.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BASE =
  "https://raw.githubusercontent.com/SidneyBissoli/cid10-br-mcp/master/data/";

// Os CSVs do DATASUS não são quotados e cada linha é um registro completo
// (sem ";" nem quebras de linha dentro dos campos), então um split simples é
// mais robusto que um parser CSV que interpreta aspas soltas.
async function baixar(nome: string): Promise<string[][]> {
  const r = await fetch(BASE + nome, { headers: { "User-Agent": "ReceitaJa/1.0" } });
  if (!r.ok) throw new Error(`Falha ao baixar ${nome}: HTTP ${r.status}`);
  const buf = await r.arrayBuffer();
  const text = new TextDecoder("iso-8859-1").decode(buf);
  return text
    .split(/\r?\n/)
    .filter((l) => l.length > 0)
    .map((l) => l.split(";"));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  const started = Date.now();
  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const [caps, cats, subs] = await Promise.all([
      baixar("CID-10-CAPITULOS.CSV"),
      baixar("CID-10-CATEGORIAS.CSV"),
      baixar("CID-10-SUBCATEGORIAS.CSV"),
    ]);

    // Capítulos: NUMCAP;CATINIC;CATFIM;DESCRICAO;DESCRABREV
    const capitulos = caps
      .slice(1)
      .filter((r) => r.length >= 4)
      .map((r) => ({
        num: parseInt(r[0], 10),
        ini: (r[1] || "").trim(),
        fim: (r[2] || "").trim(),
        desc: (r[3] || "").trim(),
      }));

    const capDe = (cat3: string): { num: number | null; desc: string | null } => {
      const c = cat3.slice(0, 3);
      for (const cap of capitulos) {
        if (c >= cap.ini && c <= cap.fim) return { num: cap.num, desc: cap.desc };
      }
      return { num: null, desc: null };
    };

    const registros: Record<string, unknown>[] = [];

    // Categorias: CAT;CLASSIF;DESCRICAO;DESCRABREV;REFER;EXCLUIDOS
    let nCats = 0;
    for (const r of cats.slice(1)) {
      if (r.length < 3) continue;
      const cat = (r[0] || "").trim();
      if (!cat) continue;
      const cap = capDe(cat);
      registros.push({
        codigo: cat,
        descricao: (r[2] || "").trim(),
        descricao_abrev: (r[3] || "").trim() || null,
        categoria: cat,
        capitulo: cap.num,
        capitulo_descricao: cap.desc,
        nivel: "categoria",
      });
      nCats++;
    }

    // Subcategorias: SUBCAT;CLASSIF;RESTRSEXO;CAUSAOBITO;DESCRICAO;DESCRABREV;REFER;EXCLUIDOS
    let nSubs = 0;
    for (const r of subs.slice(1)) {
      if (r.length < 5) continue;
      const raw = (r[0] || "").trim(); // ex.: A000
      if (raw.length < 4) continue;
      const cat3 = raw.slice(0, 3);
      const codigo = `${cat3}.${raw.slice(3)}`; // A00.0
      const cap = capDe(cat3);
      registros.push({
        codigo,
        descricao: (r[4] || "").trim(),
        descricao_abrev: (r[5] || "").trim() || null,
        categoria: cat3,
        capitulo: cap.num,
        capitulo_descricao: cap.desc,
        nivel: "subcategoria",
      });
      nSubs++;
    }

    let importados = 0;
    const erros: string[] = [];
    const BATCH = 1000;
    for (let i = 0; i < registros.length; i += BATCH) {
      const slice = registros.slice(i, i + BATCH);
      const { error } = await admin
        .from("cid10")
        .upsert(slice, { onConflict: "codigo", ignoreDuplicates: false });
      if (error) erros.push(`Lote ${i / BATCH + 1}: ${error.message}`);
      else importados += slice.length;
    }

    return new Response(
      JSON.stringify({
        ok: erros.length === 0,
        fonte: "DATASUS — CID-10 v2008",
        categorias: nCats,
        subcategorias: nSubs,
        importados,
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
