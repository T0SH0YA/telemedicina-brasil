import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Search,
  Plus,
  Trash2,
  ShieldCheck,
  User,
  Pill,
  Stethoscope,
  FileSignature,
  Loader2,
  CheckCircle2,
  X,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { useRx } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { DocumentDialog } from "@/components/document-dialog";
import { SendDialog } from "@/components/send-dialog";
import { AsyncCombobox } from "@/components/async-combobox";
import {
  searchMedicamentos,
  searchCid,
  type MedResult,
  type CidResult,
} from "@/lib/reference";
import { cn } from "@/lib/utils";
import { ageLabel, crmDisplay, initials } from "@/lib/format";
import { useDoctor } from "@/lib/doctor-context";
import type {
  Patient,
  PrescriptionItem,
  PrescriptionType,
  Prescription,
} from "@/lib/types";

export const Route = createFileRoute("/_authenticated/nova-prescricao")({
  validateSearch: (search: Record<string, unknown>): { paciente?: string } => ({
    paciente: typeof search.paciente === "string" ? search.paciente : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Nova prescrição — ReceitaJá" },
      { name: "description", content: "Emita uma nova prescrição médica com assinatura digital." },
    ],
  }),
  component: NovaPrescricao,
});

function NovaPrescricao() {
  const { paciente } = Route.useSearch();
  const { patients, createPrescription } = useRx();
  const doctor = useDoctor();

  const [patient, setPatient] = useState<Patient | null>(
    () => patients.find((p) => p.id === paciente) ?? null,
  );
  const [patientQuery, setPatientQuery] = useState("");
  const [type, setType] = useState<PrescriptionType>("simples");
  const [items, setItems] = useState<PrescriptionItem[]>([]);
  const [notes, setNotes] = useState("");
  const [cid, setCid] = useState<CidResult | null>(null);

  const [signOpen, setSignOpen] = useState(false);
  const [signing, setSigning] = useState(false);
  const [issued, setIssued] = useState<Prescription | null>(null);
  const [viewIssued, setViewIssued] = useState(false);
  const [sending, setSending] = useState<Prescription | null>(null);

  const patientResults = useMemo(
    () =>
      patients.filter((p) =>
        p.name.toLowerCase().includes(patientQuery.toLowerCase()) ||
        (p.cpf ?? "").includes(patientQuery),
      ),
    [patients, patientQuery],
  );

  const hasControlled = items.some((i) => i.controlled);

  function addMedication(m: MedResult) {
    if (items.some((i) => i.medicationId === m.id)) return;
    const nome =
      m.substancia && m.substancia.toLowerCase() !== m.produto.toLowerCase()
        ? `${m.produto} (${m.substancia})`
        : m.produto;
    setItems((prev) => [
      ...prev,
      {
        medicationId: m.id,
        name: nome,
        form: [m.apresentacao, m.laboratorio].filter(Boolean).join(" · "),
        posology: "",
        quantity: "1 caixa",
        controlled: m.controlado,
      },
    ]);
    if (m.controlado) setType("controle_especial");
  }

  function updateItem(id: string, patch: Partial<PrescriptionItem>) {
    setItems((prev) => prev.map((i) => (i.medicationId === id ? { ...i, ...patch } : i)));
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.medicationId !== id));
  }

  const canIssue = patient && items.length > 0;

  function confirmSignature() {
    if (!patient) return;
    setSigning(true);
    setTimeout(async () => {
      try {
        const rx = await createPrescription({
          patient,
          type,
          items,
          notes: notes.trim() || undefined,
          cidCodigo: cid?.codigo,
          cidDescricao: cid?.descricao,
        });
        setSignOpen(false);
        setIssued(rx);
        setViewIssued(true);
        toast.success("Prescrição assinada e emitida com sucesso");
        // reset
        setPatient(null);
        setItems([]);
        setNotes("");
        setType("simples");
        setCid(null);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Falha ao emitir a prescrição.");
      } finally {
        setSigning(false);
      }
    }, 1400);
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold text-foreground">Nova prescrição</h1>
        <p className="text-sm text-muted-foreground">
          Selecione o paciente, adicione os medicamentos e assine digitalmente.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {/* 1. Paciente */}
          <Section step={1} icon={User} title="Paciente">
            {patient ? (
              <div className="flex items-center justify-between rounded-xl border border-primary/40 bg-accent/50 p-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary font-display text-xs font-bold text-primary-foreground">
                    {initials(patient.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">{patient.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {ageLabel(patient.birthDate)}
                      {patient.cpf ? ` · CPF ${patient.cpf}` : ""}
                      {patient.allergies.length > 0 && (
                        <span className="ml-1 text-destructive">
                          · Alergias: {patient.allergies.join(", ")}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setPatient(null)}>
                  Trocar
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    autoFocus
                    placeholder="Buscar paciente por nome ou CPF..."
                    value={patientQuery}
                    onChange={(e) => setPatientQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="max-h-56 space-y-1 overflow-y-auto">
                  {patientResults.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setPatient(p);
                        setPatientQuery("");
                      }}
                      className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-muted"
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary font-display text-xs font-bold text-secondary-foreground">
                        {initials(p.name)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-foreground">
                          {p.name}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {ageLabel(p.birthDate)} · {p.city ?? "—"}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Section>

          {/* 2. Tipo */}
          <Section step={2} icon={FileSignature} title="Tipo de receituário">
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  { id: "simples", label: "Receita simples", desc: "Medicamentos comuns" },
                  {
                    id: "controle_especial",
                    label: "Controle especial",
                    desc: "Medicamentos controlados",
                  },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setType(opt.id)}
                  className={cn(
                    "rounded-xl border p-3 text-left transition-colors",
                    type === opt.id
                      ? "border-primary bg-accent/50"
                      : "border-border hover:bg-muted/60",
                  )}
                >
                  <p className="text-sm font-semibold text-foreground">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.desc}</p>
                </button>
              ))}
            </div>
            {hasControlled && type === "simples" && (
              <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-warning-foreground">
                <AlertTriangle className="h-3.5 w-3.5" /> Há medicamento controlado — recomendado
                controle especial.
              </p>
            )}
          </Section>

          {/* 3. Medicamentos */}
          <Section step={3} icon={Pill} title="Medicamentos">
            <AsyncCombobox<MedResult>
              placeholder="Buscar por nome comercial ou princípio ativo (ex.: dipirona)..."
              search={(q) => searchMedicamentos(q)}
              onSelect={addMedication}
              getKey={(m) => m.id}
              emptyText="Nenhum medicamento encontrado na base ANVISA."
              renderItem={(m) => (
                <span className="flex w-full items-center justify-between gap-2">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {m.produto}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {[m.substancia, m.apresentacao, m.laboratorio].filter(Boolean).join(" · ") ||
                        "—"}
                    </span>
                  </span>
                  {m.controlado && (
                    <span className="shrink-0 rounded bg-warning/20 px-1.5 py-0.5 text-[10px] font-semibold text-warning-foreground">
                      Controlado
                    </span>
                  )}
                </span>
              )}
            />

            {items.length === 0 ? (
              <p className="mt-3 rounded-xl border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
                Nenhum medicamento adicionado ainda.
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {items.map((item) => (
                  <li key={item.medicationId} className="rounded-xl border border-border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <p className="font-display text-sm font-semibold text-foreground">
                          {item.name}
                        </p>
                        {item.controlled && (
                          <span className="rounded bg-warning/20 px-1.5 py-0.5 text-[10px] font-semibold text-warning-foreground">
                            Controlado
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => removeItem(item.medicationId)}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label="Remover"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_140px]">
                      <label className="block">
                        <span className="mb-1 block text-[11px] font-medium uppercase text-muted-foreground">
                          Posologia
                        </span>
                        <Input
                          value={item.posology}
                          onChange={(e) => updateItem(item.medicationId, { posology: e.target.value })}
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-[11px] font-medium uppercase text-muted-foreground">
                          Quantidade
                        </span>
                        <Input
                          value={item.quantity}
                          onChange={(e) => updateItem(item.medicationId, { quantity: e.target.value })}
                        />
                      </label>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* 4. Hipótese diagnóstica (CID) */}
          <Section step={4} icon={Stethoscope} title="Hipótese diagnóstica (CID-10)">
            {cid ? (
              <div className="flex items-center justify-between gap-2 rounded-xl border border-primary/40 bg-accent/50 p-3">
                <p className="min-w-0 truncate text-sm font-semibold text-foreground">
                  <span className="font-mono">{cid.codigo}</span> — {cid.descricao}
                </p>
                <Button variant="ghost" size="sm" onClick={() => setCid(null)}>
                  Remover
                </Button>
              </div>
            ) : (
              <AsyncCombobox<CidResult>
                placeholder="Buscar por código ou descrição (ex.: J11 ou gripe)..."
                search={(q) => searchCid(q)}
                onSelect={setCid}
                getKey={(c) => c.codigo}
                emptyText="Nenhum CID encontrado."
                renderItem={(c) => (
                  <span className="block min-w-0 truncate text-sm font-medium text-foreground">
                    <span className="font-mono">{c.codigo}</span> — {c.descricao}
                  </span>
                )}
              />
            )}
          </Section>

          {/* 5. Observações */}
          <Section step={5} icon={Plus} title="Observações (opcional)">
            <Textarea
              placeholder="Orientações ao paciente, retorno, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </Section>
        </div>

        {/* Resumo */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <h3 className="font-display font-bold text-foreground">Resumo</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <SummaryRow label="Paciente" value={patient?.name ?? "—"} />
              <SummaryRow
                label="Tipo"
                value={type === "controle_especial" ? "Controle especial" : "Receita simples"}
              />
              <SummaryRow label="Medicamentos" value={`${items.length}`} />
              <SummaryRow label="Médico" value={doctor.fullName} />
            </dl>
            <div className="mt-5 flex items-center gap-2 rounded-lg bg-muted/70 p-3 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 shrink-0 text-success" />
              Assinatura digital ICP-Brasil (simulada) aplicada na emissão.
            </div>
            <Button
              className="mt-4 w-full"
              disabled={!canIssue}
              onClick={() => setSignOpen(true)}
            >
              <FileSignature className="h-4 w-4" /> Assinar e emitir
            </Button>
            {!canIssue && (
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Selecione um paciente e ao menos um medicamento.
              </p>
            )}
          </div>
        </aside>
      </div>

      {/* Assinatura */}
      <Dialog open={signOpen} onOpenChange={(v) => !signing && setSignOpen(v)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assinatura digital</DialogTitle>
            <DialogDescription>
              Confirme sua identidade para assinar a prescrição com o certificado ICP-Brasil
              (simulado).
            </DialogDescription>
          </DialogHeader>

          {signing ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Validando certificado e assinando...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/50 p-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div className="text-sm">
                  <p className="font-semibold text-foreground">{doctor.fullName}</p>
                  <p className="text-xs text-muted-foreground">
                    {crmDisplay(doctor) || "Certificado"} · Certificado A3
                  </p>
                </div>
              </div>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted-foreground">
                  Senha do certificado (demonstração)
                </span>
                <Input type="password" placeholder="••••••••" defaultValue="123456" />
              </label>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setSignOpen(false)}>
                  <X className="h-4 w-4" /> Cancelar
                </Button>
                <Button className="flex-1" onClick={confirmSignature}>
                  <CheckCircle2 className="h-4 w-4" /> Assinar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <DocumentDialog
        rx={viewIssued ? issued : null}
        open={viewIssued}
        onOpenChange={setViewIssued}
        onSend={(rx) => {
          setViewIssued(false);
          setSending(rx);
        }}
      />
      <SendDialog rx={sending} open={!!sending} onOpenChange={(v) => !v && setSending(null)} />
    </div>
  );
}

function Section({
  step,
  icon: Icon,
  title,
  children,
}: {
  step: number;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
          {step}
        </span>
        <h2 className="flex items-center gap-2 font-display font-bold text-foreground">
          <Icon className="h-4 w-4 text-primary" /> {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="max-w-[60%] truncate text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}
