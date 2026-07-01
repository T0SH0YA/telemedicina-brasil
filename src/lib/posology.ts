const x = { a: [1, 2] };
function f() { return x; }// Motor de sugestão de posologia (Bloco 2).
// IMPORTANTE: as sugestões são VALORES DE REFERÊNCIA (dose usual adulta de bula).
// Devem SEMPRE ser revisadas e ajustadas pelo médico para cada paciente
// (peso, função renal/hepática, pediatria, gestação, interações, etc.).

import type { MedResult } from "./reference";

export type Via =
  | "via oral"
  | "via sublingual"
  | "via nasal"
  | "via oftálmica"
  | "via otológica"
  | "via inalatória"
  | "via tópica"
  | "via retal"
  | "via vaginal"
  | "via intramuscular"
  | "via subcutânea";

export interface PosologySuggestion {
  /** Verbo de administração: Tomar, Aplicar, Usar, Inalar, Pingar... */
  verbo: string;
  /** Quantidade + unidade por dose. Ex.: "1 comprimido", "40 gotas", "1 jato". */
  dose: string;
  via: Via;
  /** Frequência legível. Ex.: "de 8/8h", "1x ao dia", "a cada 12 horas". */
  frequencia: string;
  /** Duração do tratamento. Ex.: "por 7 dias". Vazio = sem duração fixa. */
  duracao: string;
  /** Observação clínica opcional. Ex.: "se dor ou febre", "em jejum". */
  observacao?: string;
  /** Marca uso contínuo (sem duração determinada). */
  usoContinuo: boolean;
  /** Quantidade sugerida a dispensar. Ex.: "1 caixa", "1 frasco". */
  quantidade: string;
  /** Confiança da sugestão: "dicionario" (regra específica) ou "generico" (fallback). */
  origem: "dicionario" | "generico";
}

/* --------------------------- utilidades de forma --------------------------- */

export type FormaFarmaceutica =
  | "comprimido"
  | "capsula"
  | "gotas"
  | "solucao_oral"
  | "xarope"
  | "suspensao"
  | "creme_pomada"
  | "colirio"
  | "spray_nasal"
  | "inalador"
  | "supositorio"
  | "ampola"
  | "adesivo"
  | "sache"
  | "desconhecida";

const FORMA_PATTERNS: Array<[FormaFarmaceutica, RegExp]> = [
  ["comprimido", /comprimid|compr\.?|\bcp\b|drágea|dragea|\bcpr\b/i],
  ["capsula", /cápsul|capsul|\bcaps\b/i],
  ["gotas", /gota|solução oral.*gota|\bgts\b/i],
  ["xarope", /xarope/i],
  ["suspensao", /suspens/i],
  ["solucao_oral", /solução oral|solucao oral|elixir/i],
  ["colirio", /colírio|colirio|oftálm|oftalm/i],
  ["spray_nasal", /spray nasal|nasal.*spray|solução nasal|descongest.*nasal/i],
  ["inalador", /inalató|inalato|aerossol|spray oral|cápsula inalante/i],
  ["creme_pomada", /creme|pomada|gel\b|loção|locao|unguento/i],
  ["supositorio", /supositó|suposito/i],
  ["adesivo", /adesivo|transdérm|transderm/i],
  ["ampola", /ampola|injetáv|injetav|solução injetável/i],
  ["sache", /sachê|sache|pó para|envelope/i],
];

export function detectForma(m: Pick<MedResult, "apresentacao" | "produto">): FormaFarmaceutica {
  const hay = `${m.apresentacao ?? ""} ${m.produto ?? ""}`.toLowerCase();
  for (const [forma, re] of FORMA_PATTERNS) {
    if (re.test(hay)) return forma;
  }
  return "desconhecida";
}

interface FormaDefaults {
  verbo: string;
  dose: string;
  via: Via;
  quantidade: string;
}

const FORMA_DEFAULTS: Record<FormaFarmaceutica, FormaDefaults> = {
  comprimido: { verbo: "Tomar", dose: "1 comprimido", via: "via oral", quantidade: "1 caixa" },
  capsula: { verbo: "Tomar", dose: "1 cápsula", via: "via oral", quantidade: "1 caixa" },
  gotas: { verbo: "Tomar", dose: "20 gotas", via: "via oral", quantidade: "1 frasco" },
  solucao_oral: { verbo: "Tomar", dose: "10 mL", via: "via oral", quantidade: "1 frasco" },
  xarope: { verbo: "Tomar", dose: "10 mL", via: "via oral", quantidade: "1 frasco" },
  suspensao: { verbo: "Tomar", dose: "5 mL", via: "via oral", quantidade: "1 frasco" },
  creme_pomada: { verbo: "Aplicar", dose: "camada fina", via: "via tópica", quantidade: "1 bisnaga" },
  colirio: { verbo: "Pingar", dose: "1 gota em cada olho", via: "via oftálmica", quantidade: "1 frasco" },
  spray_nasal: { verbo: "Aplicar", dose: "1 jato em cada narina", via: "via nasal", quantidade: "1 frasco" },
  inalador: { verbo: "Inalar", dose: "1 jato", via: "via inalatória", quantidade: "1 dispositivo" },
  supositorio: { verbo: "Introduzir", dose: "1 supositório", via: "via retal", quantidade: "1 caixa" },
  ampola: { verbo: "Aplicar", dose: "1 ampola", via: "via intramuscular", quantidade: "1 caixa" },
  adesivo: { verbo: "Aplicar", dose: "1 adesivo", via: "via tópica", quantidade: "1 caixa" },
  sache: { verbo: "Tomar", dose: "1 sachê", via: "via oral", quantidade: "1 caixa" },
  desconhecida: { verbo: "Tomar", dose: "1 unidade", via: "via oral", quantidade: "1 caixa" },
};

/* ------------------------- dicionário de substâncias ------------------------ */

interface SubstanceRule {
  /** Regex aplicada sobre substância + produto (minúsculas, sem acento). */
  match: RegExp;
  frequencia: string;
  duracao: string;
  observacao?: string;
  usoContinuo?: boolean;
  /** Sobrescreve a dose padrão da forma, quando fizer sentido. */
  dose?: string;
}

// Regras baseadas em posologia usual adulta (bula). SEMPRE editável pelo médico.
const SUBSTANCE_RULES: SubstanceRule[] = [
  { match: /dipirona|metamizol/, frequencia: "de 6/6h", duracao: "", observacao: "se dor ou febre" },
  { match: /paracetamol|acetaminofeno/, frequencia: "de 6/6h", duracao: "", observacao: "se dor ou febre" },
  { match: /ibuprofeno/, frequencia: "de 8/8h", duracao: "por 5 dias", observacao: "após as refeições" },
  { match: /nimesulida/, frequencia: "de 12/12h", duracao: "por 5 dias", observacao: "após as refeições" },
  { match: /diclofenaco/, frequencia: "de 8/8h", duracao: "por 5 dias", observacao: "após as refeições" },
  { match: /amoxicilina.*clavulanato|clavulanato/, frequencia: "de 12/12h", duracao: "por 7 dias" },
  { match: /amoxicilina/, frequencia: "de 8/8h", duracao: "por 7 dias" },
  { match: /azitromicina/, frequencia: "1x ao dia", duracao: "por 5 dias", observacao: "1h antes ou 2h após as refeições" },
  { match: /cefalexina/, frequencia: "de 6/6h", duracao: "por 7 dias" },
  { match: /ciprofloxacino/, frequencia: "de 12/12h", duracao: "por 7 dias" },
  { match: /omeprazol|pantoprazol|esomeprazol|lansoprazol/, frequencia: "1x ao dia", duracao: "por 30 dias", observacao: "em jejum, 30 min antes do café" },
  { match: /losartana|valsartana|olmesartana/, frequencia: "1x ao dia", duracao: "", usoContinuo: true, observacao: "controle de pressão" },
  { match: /enalapril|captopril|ramipril/, frequencia: "de 12/12h", duracao: "", usoContinuo: true, observacao: "controle de pressão" },
  { match: /anlodipino|amlodipino|nifedipino/, frequencia: "1x ao dia", duracao: "", usoContinuo: true },
  { match: /hidroclorotiazida|clortalidona/, frequencia: "1x ao dia", duracao: "", usoContinuo: true, observacao: "pela manhã" },
  { match: /metformina/, frequencia: "de 12/12h", duracao: "", usoContinuo: true, observacao: "após as refeições" },
  { match: /sinvastatina|atorvastatina|rosuvastatina/, frequencia: "1x ao dia", duracao: "", usoContinuo: true, observacao: "à noite" },
  { match: /levotiroxina/, frequencia: "1x ao dia", duracao: "", usoContinuo: true, observacao: "em jejum, 30 min antes do café" },
  { match: /sertralina|fluoxetina|escitalopram|paroxetina/, frequencia: "1x ao dia", duracao: "", usoContinuo: true, observacao: "pela manhã" },
  { match: /loratadina|desloratadina|cetirizina|fexofenadina/, frequencia: "1x ao dia", duracao: "por 7 dias" },
  { match: /prednisona|prednisolona/, frequencia: "1x ao dia", duracao: "por 5 dias", observacao: "pela manhã, após o café" },
  { match: /salbutamol|fenoterol/, frequencia: "de 6/6h", duracao: "", observacao: "se falta de ar", dose: "2 jatos" },
  { match: /budesonida|beclometasona/, frequencia: "de 12/12h", duracao: "", usoContinuo: true, dose: "1 jato" },
  { match: /dexametasona.*colírio|tobramicina.*colírio|colírio/, frequencia: "de 6/6h", duracao: "por 7 dias" },
];

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/* ------------------------------- API pública ------------------------------- */

/** Monta a string de posologia legível a partir de uma sugestão estruturada. */
export function formatPosology(s: PosologySuggestion): string {
  const partes = [s.verbo, s.dose, s.via, s.frequencia];
  let base = partes.filter(Boolean).join(" ").replace(/s+/g, " ").trim();
  if (s.usoContinuo) {
    base += " — uso contínuo";
  } else if (s.duracao) {
    base += " " + s.duracao;
  }
  if (s.observacao) {
    base += `, ${s.observacao}`;
  }
  return base.replace(/s+/g, " ").trim() + ".";
}

/**
 * Sugere uma posologia estruturada para um medicamento.
 * Combina a forma farmacêutica (dose/via padrão) com a regra da substância
 * (frequência/duração/observação). Tudo permanece editável na tela.
 */
export function suggestPosology(m: Pick<MedResult, "produto" | "substancia" | "apresentacao">): PosologySuggestion {
  const forma = detectForma(m);
  const base = FORMA_DEFAULTS[forma];
  const hay = normalize(`${m.substancia ?? ""} ${m.produto ?? ""}`);
  const rule = SUBSTANCE_RULES.find((r) => r.match.test(hay));

  const suggestion: PosologySuggestion = {
    verbo: base.verbo,
    dose: rule?.dose ?? base.dose,
    via: base.via,
    frequencia: rule?.frequencia ?? "de 8/8h",
    duracao: rule?.usoContinuo ? "" : rule?.duracao ?? "",
    observacao: rule?.observacao,
    usoContinuo: rule?.usoContinuo ?? false,
    quantidade: base.quantidade,
    origem: rule ? "dicionario" : "generico",
  };
  return suggestion;
}

/** Atalhos de frequência para os campos estruturados (chips) na UI. */
export const FREQUENCIA_OPCOES: string[] = [
  "1x ao dia",
  "de 12/12h",
  "de 8/8h",
  "de 6/6h",
  "de 4/4h",
  "a cada 24 horas",
  "2x ao dia",
  "3x ao dia",
  "dose única",
  "se necessário",
];

/** Atalhos de duração para os campos estruturados (chips) na UI. */
export const DURACAO_OPCOES: string[] = [
  "por 3 dias",
  "por 5 dias",
  "por 7 dias",
  "por 10 dias",
  "por 14 dias",
  "por 30 dias",
];
