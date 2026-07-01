import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Search, Phone, Mail, MapPin, FilePlus2, AlertTriangle } from "lucide-react";
import { useRx } from "@/lib/rx-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/status-badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  ageFromBirth,
  formatDate,
  formatDateTime,
  initials,
  type Patient,
} from "@/lib/mock-data";

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
  const { patients, prescriptions } = useRx();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Patient | null>(null);

  const list = useMemo(
    () =>
      patients.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.cpf.includes(query) ||
          p.city.toLowerCase().includes(query.toLowerCase()),
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
          <p className="text-sm text-muted-foreground">{patients.length} pacientes cadastrados</p>
        </div>
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
                    {ageFromBirth(p.birthDate)} anos · {p.sex === "F" ? "Feminino" : "Masculino"}
                  </p>
                </div>
              </div>
              <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                <p className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5" /> {p.city}
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5" /> {p.phone}
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
                      {ageFromBirth(selected.birthDate)} anos · CPF {selected.cpf}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="grid gap-2 rounded-xl bg-muted/60 p-4 text-sm">
                <InfoRow icon={Mail} value={selected.email} />
                <InfoRow icon={Phone} value={selected.phone} />
                <InfoRow icon={MapPin} value={selected.city} />
                <div className="mt-1 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <span>Nascimento: {formatDate(selected.birthDate)}</span>
                  {selected.weightKg && <span>Peso: {selected.weightKg} kg</span>}
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
    </div>
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
