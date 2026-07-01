import { QRCodeSVG } from "qrcode.react";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/logo";
import { useDoctor } from "@/lib/doctor-context";
import { docMeta } from "@/lib/document-types";
import {
  ageFromBirth,
  crmDisplay,
  formatDate,
  formatDateTime,
  sexLabel,
} from "@/lib/format";
import type { Prescription } from "@/lib/types";

/* --------- formatadores literais (sem conversão de timezone) --------- */
function fmtDate(v?: string): string {
  if (!v) return "—";
  const [y, m, d] = v.split("-");
  return d ? `${d}/${m}/${y}` : v;
}
function fmtDateTime(v?: string): string {
  if (!v) return "—";
  const [date, time] = v.split("T");
  return `${fmtDate(date)}${time ? ` às ${time}` : ""}`;
}
function fmtTime(v?: string): string {
  return v || "—";
}

export function DocumentView({ rx }: { rx: Prescription }) {
  const doctor = useDoctor();
  const patient = rx.patient ?? null;
  const meta = docMeta(rx.documentType);
  const validationUrl = `https://receitaja.exemplo.com/validar/${rx.code}`;
  const crm = crmDisplay(doctor);
  const showPatientBlock = rx.documentType !== "declaracao_acompanhante" ? true : true;

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
            <p className="mt-3 font-display text-base font-bold text-foreground">{doctor.clinicName}</p>
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
          {doctor.specialty && <p className="text-xs text-muted-foreground">{doctor.specialty}</p>}
          <p className="text-xs text-muted-foreground">
            {[crm, doctor.rqe ? `RQE ${doctor.rqe}` : ""].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-lg font-bold text-foreground">{meta.docTitle}</h2>
        <span className="rounded-md bg-muted px-2.5 py-1 font-mono text-xs font-semibold text-muted-foreground">
          {rx.code}
        </span>
      </div>

      {meta.notice && (
        <p className="mt-2 rounded-lg bg-warning/10 px-3 py-2 text-xs font-medium text-warning-foreground">
          {meta.notice}
        </p>
      )}

      {/* Paciente */}
      {showPatientBlock && (
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
      )}

      {patient && patient.allergies.length > 0 && meta.usesMedications && (
        <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
          Alergias relatadas: {patient.allergies.join(", ")}
        </p>
      )}

      {/* Corpo específico do documento */}
      <div className="mt-5">
        <DocumentBody rx={rx} />
      </div>

      {rx.notes && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Observações
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{rx.notes}</p>
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

function CidLine({ rx, label = "CID-10" }: { rx: Prescription; label?: string }) {
  if (!rx.cidCodigo) return null;
  return (
    <p className="mb-3 text-sm">
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}:{" "}
      </span>
      <span className="font-medium text-foreground">
        {rx.cidCodigo}
        {rx.cidDescricao ? ` — ${rx.cidDescricao}` : ""}
      </span>
    </p>
  );
}

function DocumentBody({ rx }: { rx: Prescription }) {
  const p = rx.payload as Record<string, any>;

  switch (rx.documentType) {
    case "receita_simples":
    case "receita_controle_especial":
    case "receita_antimicrobiano":
      return (
        <>
          <CidLine rx={rx} label="Hipótese diagnóstica (CID-10)" />
          <ol className="space-y-3">
            {rx.items.map((item, i) => (
              <li key={item.medicationId + i} className="rounded-xl border border-border p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-display font-semibold text-foreground">
                    {i + 1}. {item.name}
                  </p>
                  <span className="whitespace-nowrap text-xs text-muted-foreground">{item.quantity}</span>
                </div>
                {item.form && <p className="mt-1 text-sm text-muted-foreground">{item.form}</p>}
                {item.posology && <p className="mt-1.5 text-sm text-foreground">{item.posology}</p>}
              </li>
            ))}
          </ol>
        </>
      );

    case "atestado": {
      const dias = p.dias ? Number(p.dias) : null;
      return (
        <div className="space-y-3 text-sm leading-relaxed text-foreground">
          <p>
            Atesto, para os devidos fins, que o(a) paciente <strong>{rx.patientName}</strong>
            {p.entrada ? ` esteve sob meus cuidados a partir de ${fmtDateTime(p.entrada)}` : ""}
            {p.saida ? `, com saída em ${fmtDateTime(p.saida)}` : ""}.
          </p>
          {p.motivo && <p>{p.motivo}{dias ? `, pelo período de ${dias} dia(s).` : "."}</p>}
          {(p.cidSolicitadoPeloPaciente ? true : false) && rx.cidCodigo && <CidLine rx={rx} />}
          {!p.cidSolicitadoPeloPaciente && rx.cidCodigo && (
            <p className="text-xs text-muted-foreground">CID informado mediante solicitação do paciente.</p>
          )}
          {p.cidSolicitadoPeloPaciente && (
            <p className="text-xs text-muted-foreground">
              CID exibido a pedido do paciente (Art. 5º, Resolução CFM nº 1.658/2002).
            </p>
          )}
        </div>
      );
    }

    case "declaracao_comparecimento":
      return (
        <div className="space-y-3 text-sm leading-relaxed text-foreground">
          <p>
            Declaro, para os devidos fins, que o(a) Sr(a). <strong>{rx.patientName}</strong> compareceu a
            esta unidade de atendimento em <strong>{fmtDate(p.data)}</strong>, no período das{" "}
            <strong>{fmtTime(p.entrada)}</strong> às <strong>{fmtTime(p.saida)}</strong>.
          </p>
          {p.acompanhante && <p>Acompanhado(a) por: {p.acompanhante}.</p>}
        </div>
      );

    case "declaracao_acompanhante":
      return (
        <div className="space-y-3 text-sm leading-relaxed text-foreground">
          <p>
            Declaro, para os devidos fins, que <strong>{p.acompanhanteNome ?? "—"}</strong>
            {p.acompanhanteCpf ? ` (CPF ${p.acompanhanteCpf})` : ""}
            {p.parentesco ? `, ${p.parentesco}` : ""} acompanhou o(a) paciente{" "}
            <strong>{rx.patientName}</strong> nesta unidade de atendimento.
          </p>
          {(p.periodoInicio || p.periodoFim) && (
            <p>
              Período: {fmtDateTime(p.periodoInicio)}
              {p.periodoFim ? ` até ${fmtDateTime(p.periodoFim)}` : ""}.
            </p>
          )}
        </div>
      );

    case "solicitacao_exames":
      return (
        <div className="space-y-3">
          <CidLine rx={rx} label="Indicação clínica (CID-10)" />
          <p className="text-sm font-semibold text-foreground">Solicito os seguintes exames:</p>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-foreground">
            {((p.exames as string[]) ?? []).map((ex, i) => (
              <li key={i}>{ex}</li>
            ))}
          </ol>
          {p.justificativa && (
            <p className="text-sm text-foreground">
              <span className="text-xs font-medium uppercase text-muted-foreground">Justificativa: </span>
              {p.justificativa}
            </p>
          )}
        </div>
      );

    case "encaminhamento":
      return (
        <div className="space-y-3 text-sm leading-relaxed text-foreground">
          <p>
            Encaminho o(a) paciente <strong>{rx.patientName}</strong> ao serviço de{" "}
            <strong>{p.especialidade ?? "—"}</strong>
            {p.urgencia ? ` — caráter ${labelUrgencia(p.urgencia)}` : ""}.
          </p>
          <CidLine rx={rx} />
          {p.motivo && (
            <p className="whitespace-pre-wrap">
              <span className="text-xs font-medium uppercase text-muted-foreground">Resumo do caso: </span>
              {p.motivo}
            </p>
          )}
        </div>
      );

    case "laudo_medico":
    case "relatorio_medico":
    case "parecer_tecnico":
      return (
        <div className="space-y-3">
          {p.titulo && <p className="font-display font-semibold text-foreground">{p.titulo}</p>}
          <CidLine rx={rx} />
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{p.texto}</p>
        </div>
      );

    case "laudo_medicamento_especializado":
      return (
        <div className="space-y-3 text-sm text-foreground">
          <CidLine rx={rx} label="Diagnóstico (CID-10)" />
          <div className="rounded-xl border border-border p-4">
            <p className="font-display font-semibold text-foreground">Medicamento solicitado</p>
            <p className="mt-1">{p.medicamento ?? "—"}</p>
            {p.apresentacao && <p className="text-xs text-muted-foreground">{p.apresentacao}</p>}
            {(p.posologia || p.quantidade) && (
              <p className="mt-1.5 text-sm">
                {p.posologia ? `Posologia: ${p.posologia}. ` : ""}
                {p.quantidade ? `Quantidade/mês: ${p.quantidade}.` : ""}
              </p>
            )}
          </div>
          {p.anamnese && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Anamnese
              </p>
              <p className="mt-1 whitespace-pre-wrap">{p.anamnese}</p>
            </div>
          )}
        </div>
      );

    default:
      return null;
  }
}

function labelUrgencia(u: string): string {
  if (u === "urgente") return "urgente";
  if (u === "prioritario") return "prioritário";
  return "eletivo";
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
