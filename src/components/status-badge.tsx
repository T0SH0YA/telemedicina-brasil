import { cn } from "@/lib/utils";
import { docMeta } from "@/lib/document-types";
import type { DocumentType, PrescriptionStatus } from "@/lib/types";

const statusMap: Record<PrescriptionStatus, { label: string; className: string }> = {
  rascunho: { label: "Rascunho", className: "bg-muted text-muted-foreground" },
  emitida: { label: "Emitida", className: "bg-accent text-accent-foreground" },
  enviada: { label: "Enviada", className: "bg-success/15 text-success" },
  cancelada: { label: "Cancelada", className: "bg-destructive/12 text-destructive" },
};

export function StatusBadge({ status }: { status: PrescriptionStatus }) {
  const s = statusMap[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        s.className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {s.label}
    </span>
  );
}

// Tipos que recebem destaque (tarja) por serem controlados.
const highlighted: DocumentType[] = ["receita_controle_especial", "receita_antimicrobiano"];

export function DocumentTypeBadge({ type }: { type: DocumentType }) {
  const meta = docMeta(type);
  const isHighlighted = highlighted.includes(type);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold",
        isHighlighted ? "bg-warning/20 text-warning-foreground" : "bg-muted text-muted-foreground",
      )}
    >
      <meta.icon className="h-3 w-3" />
      {meta.short}
    </span>
  );
}
