import { type ReactNode } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AsyncCombobox } from "@/components/async-combobox";
import { searchCid, type CidResult } from "@/lib/reference";
import type { DocumentType, PrescriptionItem } from "@/lib/types";

export interface DocFormProps {
  documentType: DocumentType;
  payload: Record<string, any>;
  setPayload: (patch: Record<string, any>) => void;
  cid: CidResult | null;
  setCid: (c: CidResult | null) => void;
  items: PrescriptionItem[];
  setItems: React.Dispatch<React.SetStateAction<PrescriptionItem[]>>;
  notes: string;
  setNotes: (v: string) => void;
}

export function Labeled({
  label,
  className,
  children,
  hint,
}: {
  label: string;
  className?: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className={className}>
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-muted-foreground">{hint}</span>}
    </label>
  );
}

/** Campo de CID-10 reutilizável (autocomplete por código ou descrição). */
export function CidField({
  cid,
  setCid,
  label = "CID-10",
  placeholder = "Buscar por código ou descrição (ex.: J11 ou gripe)...",
}: {
  cid: CidResult | null;
  setCid: (c: CidResult | null) => void;
  label?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
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
          placeholder={placeholder}
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
    </div>
  );
}

export function NotesField({ value, onChange, label = "Observações (opcional)" }: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
}) {
  return (
    <Labeled label={label}>
      <Textarea
        placeholder="Orientações, informações adicionais, etc."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
      />
    </Labeled>
  );
}
