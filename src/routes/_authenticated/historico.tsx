import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, Eye, Send, Ban, FilePlus2, Pencil, Copy } from "lucide-react";
import { toast } from "sonner";
import { useRx } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge, DocumentTypeBadge } from "@/components/status-badge";
import { DocumentDialog } from "@/components/document-dialog";
import { SendDialog } from "@/components/send-dialog";
import { cn } from "@/lib/utils";
import { formatDateTime, initials } from "@/lib/format";
import { ALL_DOC_TYPES, docMeta } from "@/lib/document-types";
import type { DocumentType, Prescription, PrescriptionStatus } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/historico")({
  head: () => ({
    meta: [
      { title: "Histórico de documentos — ReceitaJá" },
      { name: "description", content: "Consulte, envie e gerencie todos os documentos emitidos." },
    ],
  }),
  component: Historico,
});

const statusFilters: { id: PrescriptionStatus | "todas"; label: string }[] = [
  { id: "todas", label: "Todas" },
  { id: "emitida", label: "Emitidas" },
  { id: "enviada", label: "Enviadas" },
  { id: "cancelada", label: "Canceladas" },
];

function Historico() {
  const { prescriptions, cancel } = useRx();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<PrescriptionStatus | "todas">("todas");
  const [docType, setDocType] = useState<DocumentType | "todos">("todos");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [viewing, setViewing] = useState<Prescription | null>(null);
  const [sending, setSending] = useState<Prescription | null>(null);

  const list = useMemo(() => {
    return prescriptions.filter((rx) => {
      const matchStatus = status === "todas" || rx.status === status;
      const matchType = docType === "todos" || rx.documentType === docType;
      const matchQuery =
        rx.patientName.toLowerCase().includes(query.toLowerCase()) ||
        rx.code.toLowerCase().includes(query.toLowerCase());
      const created = rx.createdAt.slice(0, 10);
      const matchFrom = !from || created >= from;
      const matchTo = !to || created <= to;
      return matchStatus && matchType && matchQuery && matchFrom && matchTo;
    });
  }, [prescriptions, query, status, docType, from, to]);

  return (
    <div className="space-y-6">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="min-w-0">
          <h1 className="truncate font-display text-2xl font-bold text-foreground">Histórico</h1>
          <p className="text-sm text-muted-foreground">{prescriptions.length} documentos no total</p>
        </div>
        <Button asChild>
          <Link to="/nova-prescricao">
            <FilePlus2 className="h-4 w-4" /> <span className="hidden sm:inline">Novo documento</span>
          </Link>
        </Button>
      </header>

      {/* Filtros */}
      <div className="space-y-3">
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
          <Select value={docType} onValueChange={(v) => setDocType(v as DocumentType | "todos")}>
            <SelectTrigger className="sm:w-56">
              <SelectValue placeholder="Tipo de documento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              {ALL_DOC_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {docMeta(t).short}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1">
            {statusFilters.map((f) => (
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
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              De
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9 w-auto" />
            </label>
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              Até
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9 w-auto" />
            </label>
            {(from || to) && (
              <Button variant="ghost" size="sm" onClick={() => { setFrom(""); setTo(""); }}>
                Limpar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Lista */}
      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card py-16 text-center">
          <p className="font-display font-semibold text-foreground">Nenhum documento encontrado</p>
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
                      <span className="font-mono">{rx.code}</span> · {formatDateTime(rx.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <DocumentTypeBadge type={rx.documentType} />
                  <StatusBadge status={rx.status} />
                  <div className="ml-auto flex items-center gap-1 sm:ml-2">
                    <Button variant="ghost" size="icon" aria-label="Ver" onClick={() => setViewing(rx)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label="Duplicar" asChild>
                      <Link to="/nova-prescricao" search={{ duplicar: rx.id }}>
                        <Copy className="h-4 w-4" />
                      </Link>
                    </Button>
                    {rx.status !== "cancelada" && (
                      <>
                        <Button variant="ghost" size="icon" aria-label="Editar" asChild>
                          <Link to="/nova-prescricao" search={{ editar: rx.id }}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
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
                            toast.success("Documento cancelado");
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
