// Tipos de domínio da teleprescrição — refletem o schema do banco (Lovable Cloud).

export type PatientSex = "M" | "F" | "outro";

export interface Patient {
  id: string;
  name: string;
  cpf: string | null;
  birthDate: string | null; // ISO (yyyy-mm-dd)
  sex: PatientSex | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  weightKg: number | null;
  allergies: string[];
}

// Tipo de receituário (compatibilidade com a coluna doc_type existente).
export type PrescriptionType = "simples" | "controle_especial";

// Todos os tipos de documento médico suportados (coluna document_type).
export type DocumentType =
  | "receita_simples"
  | "receita_controle_especial"
  | "receita_antimicrobiano"
  | "atestado"
  | "declaracao_comparecimento"
  | "declaracao_acompanhante"
  | "laudo_medico"
  | "relatorio_medico"
  | "solicitacao_exames"
  | "encaminhamento"
  | "parecer_tecnico"
  | "laudo_medicamento_especializado";

export type PrescriptionStatus = "rascunho" | "emitida" | "enviada" | "cancelada";

// Dados específicos de cada tipo de documento (coluna payload jsonb).
// Deliberadamente flexível — cada formulário grava as chaves que usa.
export type DocumentPayload = Record<string, unknown>;

export interface PrescriptionItem {
  medicationId: string; // id local (uuid do medicamento de referência, quando houver)
  name: string;
  form: string; // apresentação (+ laboratório)
  posology: string;
  quantity: string;
  controlled: boolean;
  compounded?: boolean;
  dosage?: string;
}

export interface Prescription {
  id: string;
  code: string; // token de validação
  patientId: string | null;
  patientName: string;
  type: PrescriptionType; // receituário (doc_type)
  documentType: DocumentType; // tipo de documento
  payload: DocumentPayload; // dados específicos do tipo
  items: PrescriptionItem[];
  notes?: string;
  cidCodigo?: string;
  cidDescricao?: string;
  createdAt: string; // issued_at (ou created_at)
  status: PrescriptionStatus;
  sentTo?: string;
  patient?: Patient | null;
}

export interface DoctorProfile {
  userId: string;
  fullName: string;
  crm: string | null;
  crmUf: string | null;
  rqe: string | null;
  specialty: string | null;
  clinicName: string | null;
  clinicAddress: string | null;
  clinicPhone: string | null;
}

export interface NewPatientInput {
  name: string;
  cpf?: string | null;
  birthDate?: string | null;
  sex?: PatientSex | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  weightKg?: number | null;
  allergies?: string[];
}

export interface NewDocumentInput {
  patient: Patient;
  documentType: DocumentType;
  type: PrescriptionType; // receituário derivado (para doc_type / render de receita)
  items?: PrescriptionItem[];
  notes?: string;
  cidCodigo?: string;
  cidDescricao?: string;
  payload?: DocumentPayload;
}
