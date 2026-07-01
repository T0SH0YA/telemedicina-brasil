import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CidField, Labeled, NotesField, type DocFormProps } from "./form-shared";

export const MOTIVOS_ATESTADO = [
  "Foi orientado(a) a permanecer em repouso",
  "Iniciar licença maternidade, devendo ficar afastada",
  "Foi orientado(a) a retornar ao trabalho",
  "Apresenta-se em condições físicas e mentais para exercer suas atividades",
  "Não se apresenta em condições físicas e mentais para exercer suas atividades",
];

export function AtestadoForm({ payload, setPayload, cid, setCid, notes, setNotes }: DocFormProps) {
  const cidSolicitado = !!payload.cidSolicitadoPeloPaciente;
  const motivo = (payload.motivo as string) ?? "";

  return (
    <div className="space-y-5">
      <div>
        <span className="mb-2 block text-xs font-medium text-muted-foreground">Motivo do atestado</span>
        <div className="space-y-2">
          {MOTIVOS_ATESTADO.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setPayload({ motivo: m })}
              className={cn(
                "block w-full rounded-xl border p-3 text-left text-sm transition-colors",
                motivo === m ? "border-primary bg-accent/50 font-medium" : "border-border hover:bg-muted/60",
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Labeled label="Dias de afastamento">
          <Input
            type="number"
            min={0}
            value={(payload.dias as string) ?? ""}
            onChange={(e) => setPayload({ dias: e.target.value })}
            placeholder="Ex.: 3"
          />
        </Labeled>
        <Labeled label="Entrada (data/hora)">
          <Input
            type="datetime-local"
            value={(payload.entrada as string) ?? ""}
            onChange={(e) => setPayload({ entrada: e.target.value })}
          />
        </Labeled>
        <Labeled label="Saída (data/hora)">
          <Input
            type="datetime-local"
            value={(payload.saida as string) ?? ""}
            onChange={(e) => setPayload({ saida: e.target.value })}
          />
        </Labeled>
      </div>

      <CidField cid={cid} setCid={setCid} label="CID-10 (opcional)" />

      <label className="flex items-start gap-2 rounded-xl border border-border bg-muted/40 p-3 text-sm">
        <input
          type="checkbox"
          checked={cidSolicitado}
          onChange={(e) => setPayload({ cidSolicitadoPeloPaciente: e.target.checked })}
          className="mt-0.5 h-4 w-4 accent-[var(--primary)]"
        />
        <span className="text-muted-foreground">
          A exibição do CID foi solicitada pelo paciente, conforme Art. 5º da Resolução CFM nº 1.658/2002.
        </span>
      </label>

      <NotesField value={notes} onChange={setNotes} />
    </div>
  );
}
