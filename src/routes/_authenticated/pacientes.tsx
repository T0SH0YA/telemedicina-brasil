import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Search,
  Phone,
  Mail,
  MapPin,
  FilePlus2,
  AlertTriangle,
  UserPlus,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useRx } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/status-badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ageLabel, formatDate, formatDateTime, initials, sexLabel } from "@/lib/format";
import type { NewPatientInput, Patient, PatientSex } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/pacientes")({
  head: () => ({
    meta: [
      { title: "Pacientes — ReceitaJá" },
      { name: "description", content: "Cadastro de pacientes e histórico de prescrições." },
    ],
  }),
  component: Pacientes,
});

function Pacientes() {
  const { patients, prescriptions, loading, createPatient } = useRx();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Patient | null>(null);
  const [creating, setCreating] = useState(false);

  const list = useMemo(
    () =>
      patients.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          (p.cpf ?? "").includes(query) ||
          (p.city ?? "").toLowerCase().includes(query.toLowerCase()),
      ),
    [patients, query],
  );

  const patientRx = selected
    ? prescriptions.filter((rx) => rx.patientId === selected.id)
    : [];

  return (
    <div className="space-y-6">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="min-w-0">
          <h1 className="truncate font-display text-2xl font-bold text-foreground">Pacientes</h1>
          <p className="text-sm text-muted-foreground">
            {patients.length} paciente{patients.length === 1 ? "" : "s"} cadastrado
            {patients.length === 1 ? "" : "s"}
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <UserPlus className="h-4 w-4" /> <span className="hidden sm:inline">Novo paciente</span>
        </Button>
      </header>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, CPF ou cidade..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card py-16 text-center">
          <p className="font-display font-semibold text-foreground">
            {patients.length === 0 ? "Nenhum paciente cadastrado" : "Nenhum paciente encontrado"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {patients.length === 0
              ? "Cadastre seu primeiro paciente para começar."
              : "Ajuste a busca."}
          </p>
          {patients.length === 0 && (
            <Button className="mt-4" onClick={() => setCreating(true)}>
              <UserPlus className="h-4 w-4" /> Cadastrar paciente
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => {
            const count = prescriptions.filter((rx) => rx.patientId === p.id).length;
            return (
              <button
                key={p.id}
                onClick={() => setSelected(p)}
                className="group rounded-2xl border border-border bg-card p-5 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-secondary font-display text-sm font-bold text-secondary-foreground">
                    {initials(p.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-display font-semibold text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {ageLabel(p.birthDate)} · {sexLabel(p.sex)}
                    </p>
                  </div>
                </div>
                <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5" /> {p.city ?? "—"}
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5" /> {p.phone ?? "—"}
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                  <span className="text-xs font-medium text-muted-foreground">
                    {count} prescriçõe{count === 1 ? "" : "s"}
                  </span>
                  {p.allergies.length > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-2 py-0.5 text-[11px] font-semibold text-destructive">
                      <AlertTriangle className="h-3 w-3" /> Alergias
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Detalhe do paciente */}
      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary font-display text-sm font-bold text-primary-foreground">
                    {initials(selected.name)}
                  </span>
                  <div className="min-w-0 text-left">
                    <DialogTitle className="truncate">{selected.name}</DialogTitle>
                    <DialogDescription>
                      {ageLabel(selected.birthDate)}
                      {selected.cpf ? ` · CPF ${selected.cpf}` : ""}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="grid gap-2 rounded-xl bg-muted/60 p-4 text-sm">
                <InfoRow icon={Mail} value={selected.email ?? "—"} />
                <InfoRow icon={Phone} value={selected.phone ?? "—"} />
                <InfoRow icon={MapPin} value={selected.city ?? "—"} />
                <div className="mt-1 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <span>Nascimento: {formatDate(selected.birthDate)}</span>
                  {selected.weightKg != null && <span>Peso: {selected.weightKg} kg</span>}
                </div>
              </div>

              {selected.allergies.length > 0 && (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
                  Alergias: {selected.allergies.join(", ")}
                </p>
              )}

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Prescrições
                </p>
                {patientRx.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma prescrição para este paciente.</p>
                ) : (
                  <ul className="space-y-2">
                    {patientRx.map((rx) => (
                      <li
                        key={rx.id}
                        className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-mono text-xs text-muted-foreground">{rx.code}</p>
                          <p className="text-xs text-muted-foreground">{formatDateTime(rx.createdAt)}</p>
                        </div>
                        <StatusBadge status={rx.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <Button
                className="w-full"
                onClick={() =>
                  navigate({ to: "/nova-prescricao", search: { paciente: selected.id } })
                }
              >
                <FilePlus2 className="h-4 w-4" /> Nova prescrição para {selected.name.split(" ")[0]}
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>

      <NewPatientDialog
        open={creating}
        onOpenChange={setCreating}
        onCreate={async (input) => {
          const p = await createPatient(input);
          toast.success("Paciente cadastrado com sucesso.");
          setCreating(false);
          setSelected(p);
        }}
      />
    </div>
  );
}

function NewPatientDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreate: (input: NewPatientInput) => Promise<void>;
}) {
  const empty = {
    name: "",
    cpf: "",
    birthDate: "",
    sex: "" as PatientSex | "",
    phone: "",
    email: "",
    address: "",
    city: "",
    weightKg: "",
    allergies: "",
  };
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const set =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Informe o nome do paciente.");
      return;
    }
    setSaving(true);
    try {
      await onCreate({
        name: form.name.trim(),
        cpf: form.cpf.trim() || null,
        birthDate: form.birthDate || null,
        sex: (form.sex || null) as PatientSex | null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        address: form.address.trim() || null,
        city: form.city.trim() || null,
        weightKg: form.weightKg ? Number(form.weightKg) : null,
        allergies: form.allergies
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      });
      setForm(empty);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível salvar o paciente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo paciente</DialogTitle>
          <DialogDescription>Preencha os dados do paciente.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome completo *" className="sm:col-span-2">
            <Input value={form.name} onChange={set("name")} required placeholder="Nome do paciente" />
          </Field>
          <Field label="CPF">
            <Input value={form.cpf} onChange={set("cpf")} placeholder="000.000.000-00" />
          </Field>
          <Field label="Data de nascimento">
            <Input type="date" value={form.birthDate} onChange={set("birthDate")} />
          </Field>
          <Field label="Sexo">
            <select
              value={form.sex}
              onChange={set("sex")}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">—</option>
              <option value="F">Feminino</option>
              <option value="M">Masculino</option>
              <option value="outro">Outro</option>
            </select>
          </Field>
          <Field label="Peso (kg)">
            <Input type="number" step="0.1" value={form.weightKg} onChange={set("weightKg")} placeholder="70" />
          </Field>
          <Field label="Telefone">
            <Input value={form.phone} onChange={set("phone")} placeholder="(11) 99999-0000" />
          </Field>
          <Field label="E-mail">
            <Input type="email" value={form.email} onChange={set("email")} placeholder="paciente@email.com" />
          </Field>
          <Field label="Cidade">
            <Input value={form.city} onChange={set("city")} placeholder="São Paulo/SP" />
          </Field>
          <Field label="Endereço" className="sm:col-span-2">
            <Input value={form.address} onChange={set("address")} placeholder="Rua, número, bairro" />
          </Field>
          <Field label="Alergias (separadas por vírgula)" className="sm:col-span-2">
            <Textarea value={form.allergies} onChange={set("allergies")} rows={2} placeholder="Dipirona, Penicilina" />
          </Field>
          <div className="sm:col-span-2 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Salvar paciente
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={className}>
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function InfoRow({
  icon: Icon,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
}) {
  return (
    <p className="flex items-center gap-2 text-foreground">
      <Icon className="h-4 w-4 text-muted-foreground" /> {value}
    </p>
  );
}
