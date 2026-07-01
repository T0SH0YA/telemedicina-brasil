import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { docMeta } from "@/lib/document-types";
import { CidField, Labeled, type DocFormProps } from "./form-shared";

// Laudo Médico, Relatório Médico e Parecer Técnico: CID + editor de texto livre.
export function TextoLivreForm({ documentType, payload, setPayload, cid, setCid }: DocFormProps) {
  const meta = docMeta(documentType);

  return (
    <div className="space-y-5">
      <Labeled label="Título (opcional)">
        <Input
          value={(payload.titulo as string) ?? ""}
          onChange={(e) => setPayload({ titulo: e.target.value })}
          placeholder={meta.docTitle}
        />
      </Labeled>

      <CidField cid={cid} setCid={setCid} label="CID-10 (opcional)" />

      <Labeled label={`Texto do ${meta.short.toLowerCase()}`}>
        <Textarea
          rows={10}
          placeholder="Descreva o conteúdo do documento..."
          value={(payload.texto as string) ?? ""}
          onChange={(e) => setPayload({ texto: e.target.value })}
        />
      </Labeled>
    </div>
  );
}
