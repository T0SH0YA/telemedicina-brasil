import { Input } from "@/components/ui/input";
import { Labeled, NotesField, type DocFormProps } from "./form-shared";

export function DeclaracaoAcompanhanteForm({ payload, setPayload, notes, setNotes }: DocFormProps) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Labeled label="Nome do acompanhante" className="sm:col-span-2">
          <Input
            value={(payload.acompanhanteNome as string) ?? ""}
            onChange={(e) => setPayload({ acompanhanteNome: e.target.value })}
            placeholder="Nome completo"
          />
        </Labeled>
        <Labeled label="CPF do acompanhante">
          <Input
            value={(payload.acompanhanteCpf as string) ?? ""}
            onChange={(e) => setPayload({ acompanhanteCpf: e.target.value })}
            placeholder="000.000.000-00"
          />
        </Labeled>
        <Labeled label="Grau de parentesco (opcional)">
          <Input
            value={(payload.parentesco as string) ?? ""}
            onChange={(e) => setPayload({ parentesco: e.target.value })}
            placeholder="Ex.: mãe, cônjuge"
          />
        </Labeled>
        <Labeled label="Período — início">
          <Input
            type="datetime-local"
            value={(payload.periodoInicio as string) ?? ""}
            onChange={(e) => setPayload({ periodoInicio: e.target.value })}
          />
        </Labeled>
        <Labeled label="Período — fim">
          <Input
            type="datetime-local"
            value={(payload.periodoFim as string) ?? ""}
            onChange={(e) => setPayload({ periodoFim: e.target.value })}
          />
        </Labeled>
      </div>

      <NotesField value={notes} onChange={setNotes} />
    </div>
  );
}
