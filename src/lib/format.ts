// Utilitários de formatação (timezone fixo para evitar mismatch de hidratação).
import type { DoctorProfile, PatientSex } from "./types";

const TZ = "America/Sao_Paulo";

export function ageFromBirth(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const b = new Date(iso);
  if (Number.isNaN(b.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
}

export function ageLabel(iso: string | null | undefined): string {
  const a = ageFromBirth(iso);
  return a == null ? "—" : `${a} anos`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: TZ,
  });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  });
}

export function sexLabel(sex: PatientSex | null | undefined): string {
  if (sex === "F") return "Feminino";
  if (sex === "M") return "Masculino";
  if (sex === "outro") return "Outro";
  return "—";
}

export function initials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter((p) => !p.endsWith("."));
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
}

export function generateCode(): string {
  const seg = () =>
    Array.from(
      { length: 4 },
      () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)],
    ).join("");
  return `RX-${seg()}-${seg()}`;
}

export function crmDisplay(d: DoctorProfile | null | undefined): string {
  if (!d?.crm) return "";
  return d.crmUf ? `CRM/${d.crmUf} ${d.crm}` : `CRM ${d.crm}`;
}
