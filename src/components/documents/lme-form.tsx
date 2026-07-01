import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AsyncCombobox } from "@/components/async-combobox";
import { searchMedicamentos, type MedResult } from "@/lib/reference";
import { Button } from "@/components/ui/button";
import { CidField, Labeled, type DocFormProps } from "./form-shared";

// Laudo de Medicamento Especializado (LME/APAC).
export function LmeForm({ payload, setPayload, cid, setCid }: DocFormProps) {
  const medicamento = (payload.medicamento as string) ?? "";

  function setMedicamento(m: MedResult) {
    const nome =
      m.substancia && m.substancia.toLowerCase() !== m.produto.toLowerCase()
        ? `${m.produto} (${m.substancia})`
        : m.produto;
    setPayload({ medicamento: nome, apresentacao: m.apresentacao ?? "" });
  }

  return (
    <div className="space-y-5">
      <div>
        <span className="mb-1 block text-xs font-medium text-muted-foreground">
          Medicamento solicitado
        </span>
        {medicamento ? (
          <div className="flex items-center justify-between gap-2 rounded-xl border border-primary/40 bg-accent/50 p-3">
            <p className="min-w-0 truncate text-sm font-semibold text-foreground">{medicamento}</p>
            <Button variant="ghost" size="sm" onClick={() => setPayload({ medicamento: "", apresentacao: "" })}>
              Trocar
            </Button>
          </div>
        ) : (
          <AsyncCombobox<MedResult>
            placeholder="Buscar medicamento no catálogo..."
            search={(q) => searchMedicamentos(q)}
            onSelect={setMedicamento}
            getKey={(m) => m.id}
            emptyText="Nenhum medicamento encontrado."
            renderItem={(m) => (
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-foreground">{m.produto}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {[m.substancia, m.apresentacao].filter(Boolean).join(" · ") || "—"}
                </span>
              </span>
            )}
          />
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Labeled label="Posologia / esquema terapêutico">
          <Input
            value={(payload.posologia as string) ?? ""}
            onChange={(e) => setPayload({ posologia: e.target.value })}
            placeholder="Ex.: 1 comp. 12/12h"
          />
        </Labeled>
        <Labeled label="Quantidade solicitada (mês)">
          <Input
            value={(payload.quantidade as string) ?? ""}
            onChange={(e) => setPayload({ quantidade: e.target.value })}
            placeholder="Ex.: 60 comprimidos"
          />
        </Labeled>
      </div>

      <CidField cid={cid} setCid={setCid} label="Diagnóstico (CID-10)" />

      <Labeled label="Anamnese">
        <Textarea
          rows={6}
          placeholder="História clínica, evolução e justificativa para o medicamento."
          value={(payload.anamnese as string) ?? ""}
          onChange={(e) => setPayload({ anamnese: e.target.value })}
        />
      </Labeled>
    </div>
  );
}
