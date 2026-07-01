import { Trash2, AlertTriangle, Wand2, Infinity as InfinityIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AsyncCombobox } from "@/components/async-combobox";
import { searchMedicamentos, type MedResult } from "@/lib/reference";
import { docMeta } from "@/lib/document-types";
import {
  suggestPosology,
  formatPosology,
  FREQUENCIA_OPCOES,
  DURACAO_OPCOES,
} from "@/lib/posology";
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
        ? m.produto + " (" + m.substancia + ")"
        : m.produto;
    const sug = suggestPosology(m);
    setItems((prev) => [
      ...prev,
      {
        medicationId: m.id,
        name: nome,
        form: [m.apresentacao, m.laboratorio].filter(Boolean).join(" · "),
        posology: formatPosology(sug),
        quantity: sug.quantidade,
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
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-display text-sm font-semibold text-foreground">{item.name}</p>
                      {item.controlled && (
                        <span className="rounded bg-warning/20 px-1.5 py-0.5 text-[10px] font-semibold text-warning-foreground">
                          Controlado
                        </span>
                      )}
                    </div>
                    {item.form && (
                      <p className="truncate text-[11px] text-muted-foreground">{item.form}</p>
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

                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase text-muted-foreground">
                    <Wand2 className="h-3 w-3" /> Frequência
                  </span>
                  {FREQUENCIA_OPCOES.slice(0, 5).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() =>
                        updateItem(item.medicationId, {
                          posology: applyFragment(item.posology, f, FREQUENCIA_OPCOES),
                        })
                      }
                      className="rounded-full border border-border px-2 py-0.5 text-[11px] text-foreground hover:bg-accent"
                    >
                      {f}
                    </button>
                  ))}
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-medium uppercase text-muted-foreground">Duração</span>
                  {DURACAO_OPCOES.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() =>
                        updateItem(item.medicationId, {
                          posology: applyFragment(item.posology, d, DURACAO_OPCOES),
                        })
                      }
                      className="rounded-full border border-border px-2 py-0.5 text-[11px] text-foreground hover:bg-accent"
                    >
                      {d}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => updateItem(item.medicationId, { posology: toggleContinuo(item.posology) })}
                    className="inline-flex items-center gap-1 rounded-full border border-primary/40 px-2 py-0.5 text-[11px] font-medium text-primary hover:bg-primary/10"
                  >
                    <InfinityIcon className="h-3 w-3" /> Uso contínuo
                  </button>
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

/* --------------------------- helpers de posologia --------------------------- */

// Opções contêm apenas letras, dígitos, espaço e "/". Escapamos só a barra.
function escapeRegExp(s: string): string {
  return s.replace(new RegExp("/", "g"), "\\/");
}

// Aplica um fragmento (removendo opção anterior do mesmo grupo) e recompõe a posologia.
function applyFragment(current: string, fragment: string, group: string[]): string {
  let base = (current || "").trim().replace(/\.+$/, "");
  for (const opt of group) {
    base = base.replace(new RegExp("\\s*" + escapeRegExp(opt), "gi"), "");
  }
  base = base.replace(/\s*—?\s*uso contínuo/gi, "").trim();
  base = (base + " " + fragment).replace(/\s+/g, " ").trim();
  return base + ".";
}

function toggleContinuo(current: string): string {
  let base = (current || "").trim().replace(/\.+$/, "");
  if (/uso contínuo/i.test(base)) {
    base = base.replace(/\s*—?\s*uso contínuo/gi, "").trim();
    return base + ".";
  }
  base = base.replace(/\s*por\s+\d+\s*dias?/gi, "").trim();
  return (base + " — uso contínuo").replace(/\s+/g, " ").trim() + ".";
}
