// Dados de exemplo FICTÍCIOS para o protótipo de teleprescrição.
// Nenhum dado real de paciente ou medicamento vinculado a pessoas reais.

export type PatientSex = "M" | "F";

export interface Patient {
  id: string;
  name: string;
  cpf: string;
  birthDate: string; // ISO
  sex: PatientSex;
  phone: string;
  email: string;
  city: string;
  weightKg?: number;
  allergies: string[];
}

export interface Medication {
  id: string;
  name: string;
  form: string; // apresentação
  category: string;
  controlled: boolean; // receita de controle especial
  defaultPosology: string;
}

export type PrescriptionType = "simples" | "controle_especial";
export type PrescriptionStatus = "emitida" | "enviada" | "cancelada";

export interface PrescriptionItem {
  medicationId: string;
  name: string;
  form: string;
  posology: string;
  quantity: string;
  controlled: boolean;
}

export interface Prescription {
  id: string;
  code: string; // código de validação
  patientId: string;
  patientName: string;
  type: PrescriptionType;
  items: PrescriptionItem[];
  notes?: string;
  createdAt: string; // ISO
  status: PrescriptionStatus;
  sentTo?: string; // canal de envio
}

export const doctor = {
  name: "Dra. Helena Vasconcelos",
  specialty: "Clínica Médica",
  crm: "CRM/SP 123.456",
  rqe: "RQE 45.678",
  clinic: "Clínica Vida Integral",
  address: "Av. das Nações, 1200 — Sala 84 — São Paulo/SP",
  phone: "(11) 3000-0000",
};

export const patients: Patient[] = [
  {
    id: "p1",
    name: "Marina Torres Almeida",
    cpf: "123.456.789-00",
    birthDate: "1991-04-12",
    sex: "F",
    phone: "(11) 98888-1122",
    email: "marina.almeida@exemplo.com",
    city: "São Paulo/SP",
    weightKg: 63,
    allergies: ["Dipirona"],
  },
  {
    id: "p2",
    name: "Rafael Nogueira Lima",
    cpf: "234.567.890-11",
    birthDate: "1978-11-30",
    sex: "M",
    phone: "(11) 97777-3344",
    email: "rafael.lima@exemplo.com",
    city: "Guarulhos/SP",
    weightKg: 84,
    allergies: [],
  },
  {
    id: "p3",
    name: "Beatriz Camargo Souza",
    cpf: "345.678.901-22",
    birthDate: "2001-07-08",
    sex: "F",
    phone: "(21) 96666-5566",
    email: "beatriz.souza@exemplo.com",
    city: "Rio de Janeiro/RJ",
    weightKg: 58,
    allergies: ["Penicilina", "AAS"],
  },
  {
    id: "p4",
    name: "Carlos Eduardo Fontes",
    cpf: "456.789.012-33",
    birthDate: "1965-02-19",
    sex: "M",
    phone: "(31) 95555-7788",
    email: "carlos.fontes@exemplo.com",
    city: "Belo Horizonte/MG",
    weightKg: 91,
    allergies: [],
  },
  {
    id: "p5",
    name: "Juliana Prado Martins",
    cpf: "567.890.123-44",
    birthDate: "1995-09-25",
    sex: "F",
    phone: "(41) 94444-9900",
    email: "juliana.martins@exemplo.com",
    city: "Curitiba/PR",
    weightKg: 70,
    allergies: ["Lactose"],
  },
  {
    id: "p6",
    name: "André Ribeiro Gomes",
    cpf: "678.901.234-55",
    birthDate: "1988-12-03",
    sex: "M",
    phone: "(51) 93333-1010",
    email: "andre.gomes@exemplo.com",
    city: "Porto Alegre/RS",
    weightKg: 78,
    allergies: [],
  },
];

export const medications: Medication[] = [
  { id: "m1", name: "Amoxicilina 500 mg", form: "Cápsula", category: "Antibiótico", controlled: false, defaultPosology: "1 cápsula de 8/8h por 7 dias" },
  { id: "m2", name: "Dipirona 500 mg", form: "Comprimido", category: "Analgésico", controlled: false, defaultPosology: "1 comprimido até 6/6h se dor ou febre" },
  { id: "m3", name: "Omeprazol 20 mg", form: "Cápsula", category: "Inibidor de bomba de prótons", controlled: false, defaultPosology: "1 cápsula em jejum por 30 dias" },
  { id: "m4", name: "Losartana 50 mg", form: "Comprimido", category: "Anti-hipertensivo", controlled: false, defaultPosology: "1 comprimido pela manhã, uso contínuo" },
  { id: "m5", name: "Metformina 850 mg", form: "Comprimido", category: "Antidiabético", controlled: false, defaultPosology: "1 comprimido após almoço e jantar" },
  { id: "m6", name: "Sertralina 50 mg", form: "Comprimido", category: "Antidepressivo", controlled: true, defaultPosology: "1 comprimido pela manhã, uso contínuo" },
  { id: "m7", name: "Clonazepam 2 mg", form: "Comprimido", category: "Ansiolítico (B1)", controlled: true, defaultPosology: "1/2 comprimido à noite" },
  { id: "m8", name: "Prednisona 20 mg", form: "Comprimido", category: "Corticoide", controlled: false, defaultPosology: "1 comprimido pela manhã por 5 dias" },
  { id: "m9", name: "Loratadina 10 mg", form: "Comprimido", category: "Antialérgico", controlled: false, defaultPosology: "1 comprimido ao dia por 10 dias" },
  { id: "m10", name: "Ibuprofeno 600 mg", form: "Comprimido", category: "Anti-inflamatório", controlled: false, defaultPosology: "1 comprimido de 8/8h após refeições" },
  { id: "m11", name: "Azitromicina 500 mg", form: "Comprimido", category: "Antibiótico", controlled: false, defaultPosology: "1 comprimido ao dia por 5 dias" },
  { id: "m12", name: "Salbutamol spray 100 mcg", form: "Aerossol", category: "Broncodilatador", controlled: false, defaultPosology: "2 jatos até 6/6h se falta de ar" },
];

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export const seedPrescriptions: Prescription[] = [
  {
    id: "rx1",
    code: "RX-8F3K-2QA9",
    patientId: "p1",
    patientName: "Marina Torres Almeida",
    type: "simples",
    items: [
      { medicationId: "m1", name: "Amoxicilina 500 mg", form: "Cápsula", posology: "1 cápsula de 8/8h por 7 dias", quantity: "21 cápsulas", controlled: false },
      { medicationId: "m2", name: "Dipirona 500 mg", form: "Comprimido", posology: "1 comprimido até 6/6h se dor", quantity: "20 comprimidos", controlled: false },
    ],
    notes: "Retornar em caso de piora dos sintomas.",
    createdAt: daysAgo(1),
    status: "enviada",
    sentTo: "WhatsApp",
  },
  {
    id: "rx2",
    code: "RX-1D7P-9LM4",
    patientId: "p4",
    patientName: "Carlos Eduardo Fontes",
    type: "simples",
    items: [
      { medicationId: "m4", name: "Losartana 50 mg", form: "Comprimido", posology: "1 comprimido pela manhã, uso contínuo", quantity: "30 comprimidos", controlled: false },
      { medicationId: "m5", name: "Metformina 850 mg", form: "Comprimido", posology: "1 comprimido após almoço e jantar", quantity: "60 comprimidos", controlled: false },
    ],
    createdAt: daysAgo(3),
    status: "emitida",
  },
  {
    id: "rx3",
    code: "RX-5T2H-3XB7",
    patientId: "p3",
    patientName: "Beatriz Camargo Souza",
    type: "controle_especial",
    items: [
      { medicationId: "m6", name: "Sertralina 50 mg", form: "Comprimido", posology: "1 comprimido pela manhã", quantity: "30 comprimidos", controlled: true },
    ],
    notes: "Reavaliação em 30 dias.",
    createdAt: daysAgo(6),
    status: "enviada",
    sentTo: "E-mail",
  },
  {
    id: "rx4",
    code: "RX-9K4M-7WQ2",
    patientId: "p2",
    patientName: "Rafael Nogueira Lima",
    type: "simples",
    items: [
      { medicationId: "m3", name: "Omeprazol 20 mg", form: "Cápsula", posology: "1 cápsula em jejum por 30 dias", quantity: "30 cápsulas", controlled: false },
    ],
    createdAt: daysAgo(9),
    status: "cancelada",
  },
  {
    id: "rx5",
    code: "RX-3P8L-4NC1",
    patientId: "p5",
    patientName: "Juliana Prado Martins",
    type: "simples",
    items: [
      { medicationId: "m9", name: "Loratadina 10 mg", form: "Comprimido", posology: "1 comprimido ao dia por 10 dias", quantity: "10 comprimidos", controlled: false },
      { medicationId: "m8", name: "Prednisona 20 mg", form: "Comprimido", posology: "1 comprimido pela manhã por 5 dias", quantity: "5 comprimidos", controlled: false },
    ],
    createdAt: daysAgo(14),
    status: "enviada",
    sentTo: "Link",
  },
];

// Utilidades
export function ageFromBirth(iso: string): number {
  const b = new Date(iso);
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter((p) => !p.endsWith("."));
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
}

export function generateCode(): string {
  const seg = () =>
    Array.from({ length: 4 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");
  return `RX-${seg()}-${seg()}`;
}
