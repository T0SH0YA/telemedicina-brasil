import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { CidField, Labeled, type DocFormProps } from "./form-shared";

const URGENCIAS = [
  { id: "eletivo", label: "Eletivo" },
  { id: "prioritario", label: "Prioritário" },
  { id: "urgente", label: "Urgente" },
] as const;

export function EncaminhamentoForm({ payload, setPayload, cid, setCid }: DocFormProps) {
  const urgencia = (payload.urgencia as string) ?? "eletivo";

  return (
    <div className="space-y-5">
      <Labeled label="Especialidade / serviço de destino">
        <Input
          value={(payload.especialidade as string) ?? ""}
          onChange={(e) => setPayload({ especialidade: e.target.value })}
          placeholder="Ex.: Cardiologia"
        />
      </Labeled>

      <div>
        <span className="mb-2 block text-xs font-medium text-muted-foreground">Grau de urgência</span>
        <div className="grid grid-cols-3 gap-2">
          {URGENCIAS.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => setPayload({ urgencia: u.id })}
              className={cn(
                "rounded-xl border p-2.5 text-sm font-medium transition-colors",
                urgencia === u.id ? "border-primary bg-accent/50" : "border-border hover:bg-muted/60",
              )}
            >
              {u.label}
            </button>
          ))}
        </div>
      </div>

      <CidField cid={cid} setCid={setCid} label="CID-10 (opcional)" />

      <Labeled label="Motivo / resumo do caso">
        <Textarea
          rows={5}
          placeholder="Descreva o motivo do encaminhamento e o resumo clínico."
          value={(payload.motivo as string) ?? ""}
          onChange={(e) => setPayload({ motivo: e.target.value })}
        />
      </Labeled>
    </div>
  );
}
