import { supabase } from "@/integrations/supabase/client";

// Sanitiza o termo para uso seguro dentro de filtros PostgREST `.or()`
// (vírgulas e parênteses são separadores da sintaxe do or()).
function sanitize(term: string): string {
  return term.trim().replace(/[,()%_*]/g, " ").replace(/\s+/g, " ").trim();
}

export interface MedResult {
  id: string;
  produto: string;
  substancia: string | null;
  apresentacao: string | null;
  laboratorio: string | null;
  classe_terapeutica: string | null;
  tipo: "generico" | "similar" | "referencia" | null;
  controlado: boolean;
}

// Busca por nome comercial (prefixo) OU princípio ativo (trecho).
// Ex.: "dip" sugere "DIPIRONA...".
export async function searchMedicamentos(q: string, limit = 8): Promise<MedResult[]> {
  const term = sanitize(q);
  if (term.length < 2) return [];
  const { data, error } = await supabase
    .from("medicamentos")
    .select("id,produto,substancia,apresentacao,laboratorio,classe_terapeutica,tipo,controlado")
    .or(`produto.ilike.${term}%,substancia.ilike.%${term}%`)
    .order("produto", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as MedResult[];
}

export interface CidResult {
  codigo: string;
  descricao: string;
  categoria: string | null;
}

// Busca por código (prefixo) OU descrição (trecho). Ex.: "J11" ou "gripe".
export async function searchCid(q: string, limit = 8): Promise<CidResult[]> {
  const term = sanitize(q);
  if (term.length < 2) return [];
  const { data, error } = await supabase
    .from("cid10")
    .select("codigo,descricao,categoria")
    .or(`codigo.ilike.${term}%,descricao.ilike.%${term}%`)
    .order("codigo", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as CidResult[];
}

export async function contarReferencias(): Promise<{ cid10: number; medicamentos: number }> {
  const [cid, med] = await Promise.all([
    supabase.from("cid10").select("*", { count: "exact", head: true }),
    supabase.from("medicamentos").select("*", { count: "exact", head: true }),
  ]);
  return { cid10: cid.count ?? 0, medicamentos: med.count ?? 0 };
}
