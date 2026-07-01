import { Input } from "@/components/ui/input";
import { Labeled, NotesField, type DocFormProps } from "./form-shared";

export function DeclaracaoComparecimentoForm({ payload, setPayload, notes, setNotes }: DocFormProps) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <Labeled label="Data do comparecimento">
          <Input
            type="date"
            value={(payload.data as string) ?? ""}
            onChange={(e) => setPayload({ data: e.target.value })}
          />
        </Labeled>
        <Labeled label="Horário de entrada">
          <Input
            type="time"
            value={(payload.entrada as string) ?? ""}
            onChange={(e) => setPayload({ entrada: e.target.value })}
          />
        </Labeled>
        <Labeled label="Horário de saída">
          <Input
            type="time"
            value={(payload.saida as string) ?? ""}
            onChange={(e) => setPayload({ saida: e.target.value })}
          />
        </Labeled>
      </div>

      <Labeled label="Acompanhante (opcional)">
        <Input
          value={(payload.acompanhante as string) ?? ""}
          onChange={(e) => setPayload({ acompanhante: e.target.value })}
          placeholder="Nome do acompanhante"
        />
      </Labeled>

      <NotesField value={notes} onChange={setNotes} />
    </div>
  );
}
