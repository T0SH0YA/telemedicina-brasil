// Camada de dados real (Lovable Cloud). RLS restringe cada médico aos próprios dados.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { generateCode } from "./format";
import type {
  DoctorProfile,
  DocumentPayload,
  NewDocumentInput,
  NewPatientInput,
  Patient,
  Prescription,
  PrescriptionItem,
} from "./types";

/* ------------------------------- mappers ------------------------------- */

function mapPatient(row: any): Patient {
  return {
    id: row.id,
    name: row.name,
    cpf: row.cpf ?? null,
    birthDate: row.birth_date ?? null,
    sex: row.sex ?? null,
    phone: row.phone ?? null,
    email: row.email ?? null,
    address: row.address ?? null,
    city: row.city ?? null,
    weightKg: row.weight_kg != null ? Number(row.weight_kg) : null,
    allergies: row.allergies ?? [],
  };
}

function mapItem(row: any): PrescriptionItem {
  return {
    medicationId: row.medicamento_id ?? row.id,
    name: row.name,
    form: row.presentation ?? "",
    posology: row.posology ?? "",
    quantity: row.quantity ?? "",
    controlled: !!row.controlled,
    compounded: !!row.compounded,
    dosage: row.dosage ?? undefined,
  };
}

function mapPrescription(row: any): Prescription {
  const items = (row.prescription_items ?? []).map(mapItem);
  return {
    id: row.id,
    code: row.validation_token,
    patientId: row.patient_id ?? null,
    patientName: row.patient_name,
    type: row.doc_type,
    documentType: row.document_type ?? "receita_simples",
    payload: (row.payload ?? {}) as DocumentPayload,
    items,
    notes: row.notes ?? undefined,
    cidCodigo: row.cid_codigo ?? undefined,
    cidDescricao: row.cid_descricao ?? undefined,
    createdAt: row.issued_at ?? row.created_at,
    status: row.status,
    sentTo: row.sent_to ?? undefined,
    patient: row.patient ? mapPatient(row.patient) : null,
  };
}

/* ------------------------------- queries ------------------------------- */

async function fetchPatients(): Promise<Patient[]> {
  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapPatient);
}

async function fetchPrescriptions(): Promise<Prescription[]> {
  const { data, error } = await supabase
    .from("prescriptions")
    .select("*, prescription_items(*), patient:patients(*)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapPrescription);
}

/* ------------------------------ mutations ------------------------------ */

async function insertPatient(input: NewPatientInput): Promise<Patient> {
  const { data, error } = await supabase
    .from("patients")
    .insert({
      name: input.name,
      cpf: input.cpf || null,
      birth_date: input.birthDate || null,
      sex: input.sex || null,
      phone: input.phone || null,
      email: input.email || null,
      address: input.address || null,
      city: input.city || null,
      weight_kg: input.weightKg ?? null,
      allergies: input.allergies ?? [],
    })
    .select()
    .single();
  if (error) throw error;
  return mapPatient(data);
}

function isUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

function itemRows(prescriptionId: string, items: PrescriptionItem[]) {
  return items.map((i) => ({
    prescription_id: prescriptionId,
    medicamento_id: isUuid(i.medicationId) ? i.medicationId : null,
    name: i.name,
    presentation: i.form || null,
    dosage: i.dosage || null,
    quantity: i.quantity || null,
    posology: i.posology || null,
    controlled: i.controlled,
    compounded: i.compounded ?? false,
  }));
}

async function insertDocument(input: NewDocumentInput): Promise<Prescription> {
  const code = generateCode();
  const items = input.items ?? [];
  const { data: rx, error } = await supabase
    .from("prescriptions")
    .insert({
      patient_id: input.patient.id,
      patient_name: input.patient.name,
      doc_type: input.type,
      document_type: input.documentType,
      payload: (input.payload ?? {}) as any,
      status: "emitida",
      validation_token: code,
      notes: input.notes || null,
      cid_codigo: input.cidCodigo || null,
      cid_descricao: input.cidDescricao || null,
      issued_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;

  if (items.length > 0) {
    const { error: itemsError } = await supabase
      .from("prescription_items")
      .insert(itemRows(rx.id, items));
    if (itemsError) throw itemsError;
  }

  return { ...mapPrescription(rx), items, patient: input.patient };
}

async function updateDocument(id: string, input: NewDocumentInput): Promise<Prescription> {
  const items = input.items ?? [];
  const { data: rx, error } = await supabase
    .from("prescriptions")
    .update({
      patient_id: input.patient.id,
      patient_name: input.patient.name,
      doc_type: input.type,
      document_type: input.documentType,
      payload: (input.payload ?? {}) as any,
      notes: input.notes || null,
      cid_codigo: input.cidCodigo || null,
      cid_descricao: input.cidDescricao || null,
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;

  // Substitui os itens da prescrição.
  await supabase.from("prescription_items").delete().eq("prescription_id", id);
  if (items.length > 0) {
    const { error: itemsError } = await supabase
      .from("prescription_items")
      .insert(itemRows(id, items));
    if (itemsError) throw itemsError;
  }

  return { ...mapPrescription(rx), items, patient: input.patient };
}

/* -------------------------------- hooks -------------------------------- */

export function useRx() {
  const qc = useQueryClient();
  const patientsQ = useQuery({ queryKey: ["patients"], queryFn: fetchPatients });
  const rxQ = useQuery({ queryKey: ["prescriptions"], queryFn: fetchPrescriptions });

  return {
    patients: patientsQ.data ?? [],
    prescriptions: rxQ.data ?? [],
    loading: patientsQ.isLoading || rxQ.isLoading,
    error: patientsQ.error ?? rxQ.error ?? null,
    async createPatient(input: NewPatientInput) {
      const p = await insertPatient(input);
      await qc.invalidateQueries({ queryKey: ["patients"] });
      return p;
    },
    async createDocument(input: NewDocumentInput) {
      const rx = await insertDocument(input);
      await qc.invalidateQueries({ queryKey: ["prescriptions"] });
      return rx;
    },
    async updateDocument(id: string, input: NewDocumentInput) {
      const rx = await updateDocument(id, input);
      await qc.invalidateQueries({ queryKey: ["prescriptions"] });
      return rx;
    },
    async markSent(id: string, channel: string) {
      const { error } = await supabase
        .from("prescriptions")
        .update({ status: "enviada", sent_to: channel })
        .eq("id", id);
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["prescriptions"] });
    },
    async cancel(id: string) {
      const { error } = await supabase
        .from("prescriptions")
        .update({ status: "cancelada" })
        .eq("id", id);
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["prescriptions"] });
    },
  };
}

/* --------------------------- doctor profile ---------------------------- */

function mapDoctor(row: any): DoctorProfile {
  return {
    userId: row.user_id,
    fullName: row.full_name,
    crm: row.crm ?? null,
    crmUf: row.crm_uf ?? null,
    rqe: row.rqe ?? null,
    specialty: row.specialty ?? null,
    clinicName: row.clinic_name ?? null,
    clinicAddress: row.clinic_address ?? null,
    clinicPhone: row.clinic_phone ?? null,
  };
}

export async function fetchDoctorProfile(): Promise<DoctorProfile | null> {
  const { data, error } = await supabase.from("doctor_profiles").select("*").maybeSingle();
  if (error) throw error;
  return data ? mapDoctor(data) : null;
}

export interface DoctorProfileInput {
  fullName: string;
  crm?: string | null;
  crmUf?: string | null;
  rqe?: string | null;
  specialty?: string | null;
  clinicName?: string | null;
  clinicAddress?: string | null;
  clinicPhone?: string | null;
}

export async function saveDoctorProfile(input: DoctorProfileInput): Promise<DoctorProfile> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error("Sessão expirada. Faça login novamente.");

  const { data, error } = await supabase
    .from("doctor_profiles")
    .upsert(
      {
        user_id: userId,
        full_name: input.fullName,
        crm: input.crm || null,
        crm_uf: input.crmUf || null,
        rqe: input.rqe || null,
        specialty: input.specialty || null,
        clinic_name: input.clinicName || null,
        clinic_address: input.clinicAddress || null,
        clinic_phone: input.clinicPhone || null,
      },
      { onConflict: "user_id" },
    )
    .select()
    .single();
  if (error) throw error;
  return mapDoctor(data);
}
