import { QRCodeSVG } from "qrcode.react";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/logo";
import { useDoctor } from "@/lib/doctor-context";
import {
  ageFromBirth,
  crmDisplay,
  formatDate,
  formatDateTime,
  sexLabel,
} from "@/lib/format";
import type { Prescription } from "@/lib/types";

export function PrescriptionDocument({ rx }: { rx: Prescription }) {
  const doctor = useDoctor();
  const patient = rx.patient ?? null;
  const validationUrl = `https://receitaja.exemplo.com/validar/${rx.code}`;
  const crm = crmDisplay(doctor);

  return (
    <div
      data-print-root
      className="mx-auto w-full max-w-2xl rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-soft sm:p-8"
    >
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-4 border-b border-border pb-5">
        <div>
          <Logo />
          {doctor.clinicName && (
            <p className="mt-3 font-display text-base font-bold text-foreground">
              {doctor.clinicName}
            </p>
          )}
          {doctor.clinicAddress && (
            <p className="text-xs text-muted-foreground">{doctor.clinicAddress}</p>
          )}
          {doctor.clinicPhone && (
            <p className="text-xs text-muted-foreground">Tel. {doctor.clinicPhone}</p>
          )}
        </div>
        <div className="text-right">
          <p className="font-display text-sm font-bold text-foreground">{doctor.fullName}</p>
          {doctor.specialty && (
            <p className="text-xs text-muted-foreground">{doctor.specialty}</p>
          )}
          <p className="text-xs text-muted-foreground">
            {[crm, doctor.rqe ? `RQE ${doctor.rqe}` : ""].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-lg font-bold text-foreground">
          {rx.type === "controle_especial"
            ? "Receituário de Controle Especial"
            : "Prescrição Médica"}
        </h2>
        <span className="rounded-md bg-muted px-2.5 py-1 font-mono text-xs font-semibold text-muted-foreground">
          {rx.code}
        </span>
      </div>

      {/* Paciente */}
      <div className="mt-4 grid gap-x-6 gap-y-1.5 rounded-xl bg-muted/60 p-4 text-sm sm:grid-cols-2">
        <Field label="Paciente" value={rx.patientName} />
        <Field label="CPF" value={patient?.cpf ?? "—"} />
        <Field
          label="Nascimento"
          value={
            patient?.birthDate
              ? `${formatDate(patient.birthDate)} (${ageFromBirth(patient.birthDate)} anos)`
              : "—"
          }
        />
        <Field label="Sexo" value={sexLabel(patient?.sex)} />
        <Field label="Emissão" value={formatDateTime(rx.createdAt)} />
        <Field label="Cidade" value={patient?.city ?? "—"} />
      </div>

      {patient && patient.allergies.length > 0 && (
        <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
          Alergias relatadas: {patient.allergies.join(", ")}
        </p>
      )}

      {rx.cidCodigo && (
        <p className="mt-3 text-sm">
          <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Hipótese diagnóstica (CID-10):{" "}
          </span>
          <span className="font-medium text-foreground">
            {rx.cidCodigo}
            {rx.cidDescricao ? ` — ${rx.cidDescricao}` : ""}
          </span>
        </p>
      )}

      {/* Itens */}
      <ol className="mt-5 space-y-3">
        {rx.items.map((item, i) => (
          <li key={item.medicationId + i} className="rounded-xl border border-border p-4">
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-display font-semibold text-foreground">
                {i + 1}. {item.name}
              </p>
              <span className="whitespace-nowrap text-xs text-muted-foreground">{item.quantity}</span>
            </div>
            {item.form && <p className="mt-1 text-sm text-muted-foreground">{item.form}</p>}
            <p className="mt-1.5 text-sm text-foreground">{item.posology}</p>
          </li>
        ))}
      </ol>

      {rx.notes && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Observações
          </p>
          <p className="mt-1 text-sm text-foreground">{rx.notes}</p>
        </div>
      )}

      {/* Assinatura + validação */}
      <div className="mt-6 flex flex-col gap-5 border-t border-border pt-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-lg border border-success/30 bg-success/10 p-2 text-success">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <CheckCircle2 className="h-4 w-4 text-success" /> Assinado digitalmente
            </p>
            <p className="text-xs text-muted-foreground">
              {doctor.fullName}
              {crm ? ` · ${crm}` : ""}
            </p>
            <p className="text-xs text-muted-foreground">
              Certificado ICP-Brasil (simulado) · {formatDateTime(rx.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-border bg-card p-1.5">
            <QRCodeSVG value={validationUrl} size={72} fgColor="#0f3b3f" bgColor="transparent" />
          </div>
          <div className="max-w-[150px] text-[11px] leading-tight text-muted-foreground">
            Aponte a câmera para validar a autenticidade em{" "}
            <span className="font-medium text-foreground">receitaja.exemplo.com/validar</span>
          </div>
        </div>
      </div>

      <p className="mt-5 text-center text-[10px] text-muted-foreground">
        Documento fictício gerado para demonstração. Não possui validade legal.
      </p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
