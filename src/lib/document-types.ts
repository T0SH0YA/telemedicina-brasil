// Configuração central dos tipos de documento médico (espelha Mevo / CFM).
import {
  Pill,
  ShieldAlert,
  Bug,
  FileCheck2,
  CalendarClock,
  UserCheck,
  FlaskConical,
  Send,
  FileText,
  ClipboardList,
  FileSearch,
  FileHeart,
  type LucideIcon,
} from "lucide-react";
import type { DocumentType, PrescriptionType } from "./types";

export interface DocTypeMeta {
  id: DocumentType;
  /** Nome curto exibido no seletor e nos badges. */
  short: string;
  /** Título formal impresso no documento. */
  docTitle: string;
  icon: LucideIcon;
  /** Receituário correspondente (para a coluna doc_type). */
  receituarioType: PrescriptionType;
  /** Se o documento usa a lista de medicamentos (prescription_items). */
  usesMedications: boolean;
  /** Nota de validade/observação exibida na tela e no documento. */
  notice?: string;
}

export interface DocTypeGroup {
  label: string;
  types: DocumentType[];
}

export const DOC_TYPES: Record<DocumentType, DocTypeMeta> = {
  receita_simples: {
    id: "receita_simples",
    short: "Receita Simples",
    docTitle: "Prescrição Médica",
    icon: Pill,
    receituarioType: "simples",
    usesMedications: true,
  },
  receita_controle_especial: {
    id: "receita_controle_especial",
    short: "Controle Especial",
    docTitle: "Receituário de Controle Especial",
    icon: ShieldAlert,
    receituarioType: "controle_especial",
    usesMedications: true,
    notice: "Receituário em 2 vias (1ª via farmácia, 2ª via paciente). Válido por 30 dias.",
  },
  receita_antimicrobiano: {
    id: "receita_antimicrobiano",
    short: "Antimicrobiano",
    docTitle: "Receituário de Antimicrobiano",
    icon: Bug,
    receituarioType: "controle_especial",
    usesMedications: true,
    notice: "Antimicrobiano: emitido em 2 vias e válido por 10 dias a partir da emissão (RDC 20/2011).",
  },
  atestado: {
    id: "atestado",
    short: "Atestado",
    docTitle: "Atestado Médico",
    icon: FileCheck2,
    receituarioType: "simples",
    usesMedications: false,
  },
  declaracao_comparecimento: {
    id: "declaracao_comparecimento",
    short: "Decl. Comparecimento",
    docTitle: "Declaração de Comparecimento",
    icon: CalendarClock,
    receituarioType: "simples",
    usesMedications: false,
  },
  declaracao_acompanhante: {
    id: "declaracao_acompanhante",
    short: "Decl. Acompanhante",
    docTitle: "Declaração de Acompanhante",
    icon: UserCheck,
    receituarioType: "simples",
    usesMedications: false,
  },
  solicitacao_exames: {
    id: "solicitacao_exames",
    short: "Solicitação de Exames",
    docTitle: "Solicitação de Exames",
    icon: FlaskConical,
    receituarioType: "simples",
    usesMedications: false,
  },
  encaminhamento: {
    id: "encaminhamento",
    short: "Encaminhamento",
    docTitle: "Encaminhamento",
    icon: Send,
    receituarioType: "simples",
    usesMedications: false,
  },
  laudo_medico: {
    id: "laudo_medico",
    short: "Laudo Médico",
    docTitle: "Laudo Médico",
    icon: FileSearch,
    receituarioType: "simples",
    usesMedications: false,
  },
  relatorio_medico: {
    id: "relatorio_medico",
    short: "Relatório Médico",
    docTitle: "Relatório Médico",
    icon: FileText,
    receituarioType: "simples",
    usesMedications: false,
  },
  parecer_tecnico: {
    id: "parecer_tecnico",
    short: "Parecer Técnico",
    docTitle: "Parecer Técnico",
    icon: ClipboardList,
    receituarioType: "simples",
    usesMedications: false,
  },
  laudo_medicamento_especializado: {
    id: "laudo_medicamento_especializado",
    short: "LME",
    docTitle: "Laudo para Solicitação de Medicamento Especializado (LME)",
    icon: FileHeart,
    receituarioType: "simples",
    usesMedications: false,
  },
};

export const DOC_GROUPS: DocTypeGroup[] = [
  {
    label: "Receitas",
    types: ["receita_simples", "receita_controle_especial", "receita_antimicrobiano"],
  },
  {
    label: "Atestados e Declarações",
    types: ["atestado", "declaracao_comparecimento", "declaracao_acompanhante"],
  },
  {
    label: "Exames e Procedimentos",
    types: ["solicitacao_exames", "encaminhamento"],
  },
  {
    label: "Laudos e Relatórios",
    types: ["laudo_medico", "relatorio_medico", "parecer_tecnico", "laudo_medicamento_especializado"],
  },
];

export function docMeta(t: DocumentType): DocTypeMeta {
  return DOC_TYPES[t];
}

/** Todos os tipos, na ordem dos grupos. */
export const ALL_DOC_TYPES: DocumentType[] = DOC_GROUPS.flatMap((g) => g.types);
