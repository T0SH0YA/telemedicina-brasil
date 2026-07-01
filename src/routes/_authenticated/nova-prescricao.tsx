import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Search,
  ShieldCheck,
  User,
  FileText,
  FileSignature,
  Loader2,
  CheckCircle2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useRx } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { DocumentDialog } from "@/components/document-dialog";
import { SendDialog } from "@/components/send-dialog";
import { DocumentTypeSelector } from "@/components/documents/type-selector";
import { DocumentForm, canIssueDocument } from "@/components/documents/document-form";
import { docMeta } from "@/lib/document-types";
import type { CidResult } from "@/lib/reference";
import { cn } from "@/lib/utils";
import { ageLabel, crmDisplay, initials } from "@/lib/format";
import { useDoctor } from "@/lib/doctor-context";
import type { DocumentType, Patient, PrescriptionItem, Prescription } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/nova-prescricao")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { paciente?: string; editar?: string; duplicar?: string } => ({
    paciente: typeof search.paciente === "string" ? search.paciente : undefined,
    editar: typeof search.editar === "string" ? search.editar : undefined,
    duplicar: typeof search.duplicar === "string" ? search.duplicar : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Novo documento — ReceitaJá" },
      { name: "description", content: "Emita receitas, atestados, laudos e outros documentos médicos." },
    ],
  }),
  component: NovoDocumento,
});

function NovoDocumento() {
  const { paciente, editar, duplicar } = Route.useSearch();
  const { patients, prescriptions, createDocument, updateDocument } = useRx();
  const doctor = useDoctor();

  const [patient, setPatient] = useState<Patient | null>(
    () => patients.find((p) => p.id === paciente) ?? null,
  );
  const [patientQuery, setPatientQuery] = useState("");
  const [documentType, setDocumentType] = useState<DocumentType>("receita_simples");
  const [items, setItems] = useState<PrescriptionItem[]>([]);
  const [notes, setNotes] = useState("");
  const [cid, setCid] = useState<CidResult | null>(null);
  const [payload, setPayloadState] = useState<Record<string, any>>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  const [signOpen, setSignOpen] = useState(false);
  const [signing, setSigning] = useState(false);
  const [issued, setIssued] = useState<Prescription | null>(null);
  const [viewIssued, setViewIssued] = useState(false);
  const [sending, setSending] = useState<Prescription | null>(null);

  const meta = docMeta(documentType);
  const setPayload = (patch: Record<string, any>) =>
    setPayloadState((prev) => ({ ...prev, ...patch }));

  // Hidrata o formulário ao editar/duplicar um documento existente.
  const hydrated = useRef(false);
  useEffect(() => {
    if (hydrated.current) return;
    const sourceId = editar ?? duplicar;
    if (!sourceId) return;
    const source = prescriptions.find((p) => p.id === sourceId);
    if (!source) return;
    hydrated.current = true;
    setPatient(source.patient ?? patients.find((p) => p.id === source.patientId) ?? null);
    setDocumentType(source.documentType);
    setItems(source.items.map((i) => ({ ...i })));
    setNotes(source.notes ?? "");
    setPayloadState({ ...(source.payload as Record<string, any>) });
    setCid(
      source.cidCodigo
        ? { codigo: source.cidCodigo, descricao: source.cidDescricao ?? "", categoria: null }
        : null,
    );
    if (editar) setEditingId(source.id);
  }, [editar, duplicar, prescriptions, patients]);

  const patientResults = useMemo(
    () =>
      patients.filter(
        (p) =>
          p.name.toLowerCase().includes(patientQuery.toLowerCase()) ||
          (p.cpf ?? "").includes(patientQuery),
      ),
    [patients, patientQuery],
  );

  function changeType(t: DocumentType) {
    setDocumentType(t);
    // Limpa dados específicos ao trocar de tipo, mantendo paciente.
    setPayloadState({});
    if (!docMeta(t).usesMedications) setItems([]);
  }

  const canIssue = !!patient && canIssueDocument(documentType, { items, payload, cid });

  function confirmSignature() {
    if (!patient) return;
    setSigning(true);
    setTimeout(async () => {
      try {
        const input = {
          patient,
          documentType,
          type: meta.receituarioType,
          items: meta.usesMedications ? items : [],
          notes: notes.trim() || undefined,
          cidCodigo: cid?.codigo,
          cidDescricao: cid?.descricao,
          payload,
        };
        const rx = editingId ? await updateDocument(editingId, input) : await createDocument(input);
        setSignOpen(false);
        setIssued(rx);
        setViewIssued(true);
        toast.success(editingId ? "Documento atualizado com sucesso" : "Documento assinado e emitido");
        // reset
        setPatient(null);
        setItems([]);
        setNotes("");
        setDocumentType("receita_simples");
        setCid(null);
        setPayloadState({});
        setEditingId(null);
        hydrated.current = true;
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Falha ao emitir o documento.");
      } finally {
        setSigning(false);
      }
    }, 1200);
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold text-foreground">
          {editingId ? "Editar documento" : "Novo documento"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Selecione o paciente, escolha o tipo de documento, preencha e assine digitalmente.
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
                  {patientResults.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      Nenhum paciente. Cadastre em “Pacientes”.
                    </p>
                  ) : (
                    patientResults.map((p) => (
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
                    ))
                  )}
                </div>
              </div>
            )}
          </Section>

          {/* 2. Tipo de documento */}
          {patient && (
            <Section step={2} icon={FileText} title="Tipo de documento">
              <DocumentTypeSelector value={documentType} onChange={changeType} />
            </Section>
          )}

          {/* 3. Formulário específico */}
          {patient && (
            <Section step={3} icon={meta.icon} title={meta.short}>
              <DocumentForm
                documentType={documentType}
                payload={payload}
                setPayload={setPayload}
                cid={cid}
                setCid={setCid}
                items={items}
                setItems={setItems}
                notes={notes}
                setNotes={setNotes}
              />
            </Section>
          )}
        </div>

        {/* Resumo */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <h3 className="font-display font-bold text-foreground">Resumo</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <SummaryRow label="Paciente" value={patient?.name ?? "—"} />
              <SummaryRow label="Documento" value={meta.short} />
              {meta.usesMedications && (
                <SummaryRow label="Medicamentos" value={`${items.length}`} />
              )}
              <SummaryRow label="Médico" value={doctor.fullName} />
            </dl>
            <div className="mt-5 flex items-center gap-2 rounded-lg bg-muted/70 p-3 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 shrink-0 text-success" />
              Assinatura digital ICP-Brasil (simulada) aplicada na emissão.
            </div>
            <Button className="mt-4 w-full" disabled={!canIssue} onClick={() => setSignOpen(true)}>
              <FileSignature className="h-4 w-4" />
              {editingId ? "Salvar e assinar" : "Assinar e emitir"}
            </Button>
            {!canIssue && (
              <p className="mt-2 text-center text-xs text-muted-foreground">
                {patient
                  ? "Preencha os campos obrigatórios do documento."
                  : "Selecione um paciente para começar."}
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
              Confirme sua identidade para assinar o documento com o certificado ICP-Brasil (simulado).
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
