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

export type PrescriptionType = "simples" | "controle_especial";
export type PrescriptionStatus = "rascunho" | "emitida" | "enviada" | "cancelada";

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
  type: PrescriptionType;
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

export interface NewPrescriptionInput {
  patient: Patient;
  type: PrescriptionType;
  items: PrescriptionItem[];
  notes?: string;
  cidCodigo?: string;
  cidDescricao?: string;
}
