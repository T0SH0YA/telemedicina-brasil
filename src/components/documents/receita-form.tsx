import { Trash2, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AsyncCombobox } from "@/components/async-combobox";
import { searchMedicamentos, type MedResult } from "@/lib/reference";
import { docMeta } from "@/lib/document-types";
import { CidField, NotesField, type DocFormProps } from "./form-shared";
import type { PrescriptionItem } from "@/lib/types";

export function ReceitaForm({
  documentType,
  cid,
  setCid,
  items,
  setItems,
  notes,
  setNotes,
}: DocFormProps) {
  const meta = docMeta(documentType);

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
  }

  function updateItem(id: string, patch: Partial<PrescriptionItem>) {
    setItems((prev) => prev.map((i) => (i.medicationId === id ? { ...i, ...patch } : i)));
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.medicationId !== id));
  }

  return (
    <div className="space-y-5">
      {meta.notice && (
        <p className="flex items-start gap-2 rounded-xl border border-warning/40 bg-warning/10 p-3 text-xs font-medium text-warning-foreground">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {meta.notice}
        </p>
      )}

      <div>
        <span className="mb-1 block text-xs font-medium text-muted-foreground">Medicamentos</span>
        <AsyncCombobox<MedResult>
          placeholder="Buscar por nome comercial ou princípio ativo (ex.: dipirona)..."
          search={(q) => searchMedicamentos(q)}
          onSelect={addMedication}
          getKey={(m) => m.id}
          emptyText="Nenhum medicamento encontrado na base ANVISA."
          renderItem={(m) => (
            <span className="flex w-full items-center justify-between gap-2">
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-foreground">{m.produto}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {[m.substancia, m.apresentacao, m.laboratorio].filter(Boolean).join(" · ") || "—"}
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
                    <p className="font-display text-sm font-semibold text-foreground">{item.name}</p>
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
      </div>

      <CidField cid={cid} setCid={setCid} label="Hipótese diagnóstica (CID-10) — opcional" />
      <NotesField value={notes} onChange={setNotes} />
    </div>
  );
}
