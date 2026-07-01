import { useState } from "react";
import { Trash2, AlertTriangle, Wand2, Infinity as InfinityIcon, BookmarkPlus, FolderOpen, Check } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AsyncCombobox } from "@/components/async-combobox";
import { searchMedicamentos, type MedResult } from "@/lib/reference";
import { docMeta } from "@/lib/document-types";
import { suggestPosology, formatPosology, FREQUENCIA_OPCOES, DURACAO_OPCOES } from "@/lib/posology";
import { useTemplates } from "@/lib/templates";
import { CidField, NotesField, type DocFormProps } from "./form-shared";
import type { PrescriptionItem } from "@/lib/types";

// Apresentações comuns de mercado (valor de referência editável).
// A base ANVISA de dados abertos não traz a concentração; este mapa
// pré-preenche uma sugestão quando a apresentação vier vazia. O médico
// deve sempre revisar e ajustar conforme o produto prescrito.
const APRESENTACOES_COMUNS: Record<string, string> = {
  dipirona: "500 mg comprimido (também 300 mg e 1 g)",
  paracetamol: "500 mg comprimido (também 750 mg)",
  ibuprofeno: "400 mg comprimido (também 200 mg e 600 mg)",
  amoxicilina: "500 mg cápsula (também 875 mg)",
  azitromicina: "500 mg comprimido",
  omeprazol: "20 mg cápsula (também 40 mg)",
  losartana: "50 mg comprimido (também 25 mg e 100 mg)",
  "losartana potássica": "50 mg comprimido (também 25 mg e 100 mg)",
  metformina: "850 mg comprimido (também 500 mg e 1 g)",
  sinvastatina: "20 mg comprimido (também 10 mg e 40 mg)",
  atenolol: "50 mg comprimido (também 25 mg e 100 mg)",
  captopril: "25 mg comprimido (também 12,5 mg e 50 mg)",
  enalapril: "10 mg comprimido (também 5 mg e 20 mg)",
  hidroclorotiazida: "25 mg comprimido (também 50 mg)",
  prednisona: "20 mg comprimido (também 5 mg)",
  dexametasona: "4 mg comprimido (também 0,5 mg)",
  cefalexina: "500 mg cápsula",
  ciprofloxacino: "500 mg comprimido",
  nimesulida: "100 mg comprimido",
  diclofenaco: "50 mg comprimido",
  clonazepam: "2 mg comprimido (também 0,5 mg)",
};

function sugerirApresentacao(substancia?: string, produto?: string): string {
  const chave = (substancia || produto || "").toLowerCase().trim();
  if (!chave) return "";
  if (APRESENTACOES_COMUNS[chave]) return APRESENTACOES_COMUNS[chave];
  const achado = Object.keys(APRESENTACOES_COMUNS).find((k) => chave.includes(k));
  return achado ? APRESENTACOES_COMUNS[achado] : "";
}

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
  const { templates, saveTemplate, saving } = useTemplates();
  const [savingOpen, setSavingOpen] = useState(false);
  const [templateTitle, setTemplateTitle] = useState("");

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
        form: [m.apresentacao || sugerirApresentacao(m.substancia, m.produto), m.laboratorio].filter(Boolean).join(" · "),
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

  function applyTemplate(templateItems: PrescriptionItem[]) {
    setItems((prev) => {
      const existing = new Set(prev.map((i) => i.medicationId));
      const merged = [...prev];
      for (const it of templateItems) {
        if (!existing.has(it.medicationId)) merged.push(it);
      }
      return merged;
    });
    toast.success("Modelo aplicado.");
  }

  async function handleSaveTemplate() {
    const title = templateTitle.trim();
    if (!title) { toast.error("Dê um nome ao modelo."); return; }
    if (items.length === 0) { toast.error("Adicione ao menos um medicamento."); return; }
    try {
      await saveTemplate({ title, items });
      toast.success("Modelo salvo.");
      setTemplateTitle("");
      setSavingOpen(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Não foi possível salvar o modelo.");
    }
  }

  return (
    <div className="space-y-5">
      {meta.notice && (
        <p className="flex items-start gap-2 rounded-xl border border-warning/40 bg-warning/10 p-3 text-xs font-medium text-warning-foreground">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {meta.notice}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="gap-1.5">
              <FolderOpen className="h-4 w-4" /> Usar modelo
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-h-72 w-72 overflow-y-auto">
            {templates.length === 0 ? (
              <div className="px-2 py-3 text-center text-xs text-muted-foreground">
                Nenhum modelo salvo ainda.
              </div>
            ) : (
              templates.map((t) => (
                <DropdownMenuItem key={t.id} onSelect={() => applyTemplate(t.items)} className="flex-col items-start gap-0.5">
                  <span className="text-sm font-medium text-foreground">{t.title}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {t.items.length} {t.items.length === 1 ? "item" : "itens"}
                  </span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {savingOpen ? (
          <div className="flex flex-1 items-center gap-2">
            <Input
              autoFocus
              placeholder="Nome do modelo (ex.: Gripe adulto)"
              value={templateTitle}
              onChange={(e) => setTemplateTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSaveTemplate(); }}
              className="h-8 max-w-xs"
            />
            <Button type="button" size="sm" onClick={handleSaveTemplate} disabled={saving} className="gap-1">
              <Check className="h-4 w-4" /> Salvar
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setSavingOpen(false)}>
              Cancelar
            </Button>
          </div>
        ) : (
          <Button type="button" variant="ghost" size="sm" className="gap-1.5" onClick={() => setSavingOpen(true)} disabled={items.length === 0}>
            <BookmarkPlus className="h-4 w-4" /> Salvar como modelo
          </Button>
        )}
      </div>

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
                        <span className="rounded bg-warning/20 px-1.5 py-0.5 text-[10px] font-semibold text-warning-foreground">Controlado</span>
                      )}
                    </div>
                    {item.form && <p className="truncate text-xs text-muted-foreground">{item.form}</p>}
                  </div>
                  <button onClick={() => removeItem(item.medicationId)} className="text-muted-foreground hover:text-destructive" aria-label="Remover">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-2 space-y-2">
                  <label className="block">
                    <span className="mb-1 block text-[11px] font-medium uppercase text-muted-foreground">Apresentação (mg/g)</span>
                    <Input
                      value={item.form}
                      onChange={(e) => updateItem(item.medicationId, { form: e.target.value })}
                      placeholder="Ex.: 500 mg comprimido / 300 mg cápsula / 1 g"
                    />
                  </label>
                  <div className="grid gap-2 sm:grid-cols-[1fr_140px]">
                    <label className="block">
                      <span className="mb-1 block text-[11px] font-medium uppercase text-muted-foreground">Posologia</span>
                      <Input value={item.posology} onChange={(e) => updateItem(item.medicationId, { posology: e.target.value })} />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-[11px] font-medium uppercase text-muted-foreground">Quantidade</span>
                      <Input value={item.quantity} onChange={(e) => updateItem(item.medicationId, { quantity: e.target.value })} />
                    </label>
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase text-muted-foreground">
                    <Wand2 className="h-3 w-3" /> Frequência
                  </span>
                  {FREQUENCIA_OPCOES.slice(0, 5).map((f) => (
                    <button key={f} type="button" onClick={() => updateItem(item.medicationId, { posology: applyFragment(item.posology, f, FREQUENCIA_OPCOES) })} className="rounded-full border border-border px-2 py-0.5 text-[11px] text-foreground hover:bg-accent">
                      {f}
                    </button>
                  ))}
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-medium uppercase text-muted-foreground">Duração</span>
                  {DURACAO_OPCOES.map((d) => (
                    <button key={d} type="button" onClick={() => updateItem(item.medicationId, { posology: applyFragment(item.posology, d, DURACAO_OPCOES) })} className="rounded-full border border-border px-2 py-0.5 text-[11px] text-foreground hover:bg-accent">
                      {d}
                    </button>
                  ))}
                  <button type="button" onClick={() => updateItem(item.medicationId, { posology: toggleContinuo(item.posology) })} className="inline-flex items-center gap-1 rounded-full border border-primary/40 px-2 py-0.5 text-[11px] font-medium text-primary hover:bg-primary/10">
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

function escapeRegExp(s: string): string {
  return s.replace(new RegExp("/", "g"), "\\/");
}

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
