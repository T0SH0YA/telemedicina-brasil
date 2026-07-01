import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, Eye, Send, Ban, FilePlus2, Filter } from "lucide-react";
import { toast } from "sonner";
import { useRx } from "@/lib/rx-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge, TypeBadge } from "@/components/status-badge";
import { DocumentDialog } from "@/components/document-dialog";
import { SendDialog } from "@/components/send-dialog";
import { cn } from "@/lib/utils";
import { formatDateTime, initials, type Prescription, type PrescriptionStatus } from "@/lib/mock-data";

export const Route = createFileRoute("/historico")({
  head: () => ({
    meta: [
      { title: "Histórico de prescrições — ReceitaJá" },
      { name: "description", content: "Consulte, envie e gerencie todas as prescrições emitidas." },
    ],
  }),
  component: Historico,
});

const filters: { id: PrescriptionStatus | "todas"; label: string }[] = [
  { id: "todas", label: "Todas" },
  { id: "emitida", label: "Emitidas" },
  { id: "enviada", label: "Enviadas" },
  { id: "cancelada", label: "Canceladas" },
];

function Historico() {
  const { prescriptions, cancel } = useRx();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<PrescriptionStatus | "todas">("todas");
  const [viewing, setViewing] = useState<Prescription | null>(null);
  const [sending, setSending] = useState<Prescription | null>(null);

  const list = useMemo(() => {
    return prescriptions.filter((rx) => {
      const matchStatus = status === "todas" || rx.status === status;
      const matchQuery =
        rx.patientName.toLowerCase().includes(query.toLowerCase()) ||
        rx.code.toLowerCase().includes(query.toLowerCase());
      return matchStatus && matchQuery;
    });
  }, [prescriptions, query, status]);

  return (
    <div className="space-y-6">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="min-w-0">
          <h1 className="truncate font-display text-2xl font-bold text-foreground">Histórico</h1>
          <p className="text-sm text-muted-foreground">
            {prescriptions.length} prescrições no total
          </p>
        </div>
        <Button asChild>
          <Link to="/nova-prescricao">
            <FilePlus2 className="h-4 w-4" /> <span className="hidden sm:inline">Nova prescrição</span>
          </Link>
        </Button>
      </header>

      {/* Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por paciente ou código..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1">
          <Filter className="ml-1 mr-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setStatus(f.id)}
              className={cn(
                "whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                status === f.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card py-16 text-center">
          <p className="font-display font-semibold text-foreground">Nenhuma prescrição encontrada</p>
          <p className="mt-1 text-sm text-muted-foreground">Ajuste a busca ou os filtros.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          <ul className="divide-y divide-border">
            {list.map((rx) => (
              <li key={rx.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-secondary font-display text-xs font-bold text-secondary-foreground">
                    {initials(rx.patientName)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">{rx.patientName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      <span className="font-mono">{rx.code}</span> · {rx.items.length} item(ns) ·{" "}
                      {formatDateTime(rx.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <TypeBadge type={rx.type} />
                  <StatusBadge status={rx.status} />
                  <div className="ml-auto flex items-center gap-1 sm:ml-2">
                    <Button variant="ghost" size="icon" aria-label="Ver" onClick={() => setViewing(rx)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {rx.status !== "cancelada" && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Enviar"
                          onClick={() => setSending(rx)}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Cancelar"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => {
                            cancel(rx.id);
                            toast.success("Prescrição cancelada");
                          }}
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <DocumentDialog
        rx={viewing}
        open={!!viewing}
        onOpenChange={(v) => !v && setViewing(null)}
        onSend={(rx) => {
          setViewing(null);
          setSending(rx);
        }}
      />
      <SendDialog rx={sending} open={!!sending} onOpenChange={(v) => !v && setSending(null)} />
    </div>
  );
}
