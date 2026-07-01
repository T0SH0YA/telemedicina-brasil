import { cn } from "@/lib/utils";
import { DOC_GROUPS, docMeta } from "@/lib/document-types";
import type { DocumentType } from "@/lib/types";

export function DocumentTypeSelector({
  value,
  onChange,
}: {
  value: DocumentType;
  onChange: (t: DocumentType) => void;
}) {
  return (
    <div className="space-y-4">
      {DOC_GROUPS.map((group) => (
        <div key={group.label}>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {group.label}
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {group.types.map((t) => {
              const meta = docMeta(t);
              const active = value === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => onChange(t)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border p-2.5 text-left transition-colors",
                    active ? "border-primary bg-accent/50" : "border-border hover:bg-muted/60",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-8 w-8 shrink-0 place-items-center rounded-lg",
                      active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                    )}
                  >
                    <meta.icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 text-xs font-semibold text-foreground">{meta.short}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
