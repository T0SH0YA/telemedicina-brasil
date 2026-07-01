import type { DocumentType, PrescriptionItem } from "@/lib/types";
import type { CidResult } from "@/lib/reference";
import { type DocFormProps } from "./form-shared";
import { ReceitaForm } from "./receita-form";
import { AtestadoForm } from "./atestado-form";
import { DeclaracaoComparecimentoForm } from "./declaracao-comparecimento-form";
import { DeclaracaoAcompanhanteForm } from "./declaracao-acompanhante-form";
import { SolicitacaoExamesForm } from "./solicitacao-exames-form";
import { EncaminhamentoForm } from "./encaminhamento-form";
import { TextoLivreForm } from "./texto-livre-form";
import { LmeForm } from "./lme-form";

export function DocumentForm(props: DocFormProps) {
  switch (props.documentType) {
    case "receita_simples":
    case "receita_controle_especial":
    case "receita_antimicrobiano":
      return <ReceitaForm {...props} />;
    case "atestado":
      return <AtestadoForm {...props} />;
    case "declaracao_comparecimento":
      return <DeclaracaoComparecimentoForm {...props} />;
    case "declaracao_acompanhante":
      return <DeclaracaoAcompanhanteForm {...props} />;
    case "solicitacao_exames":
      return <SolicitacaoExamesForm {...props} />;
    case "encaminhamento":
      return <EncaminhamentoForm {...props} />;
    case "laudo_medico":
    case "relatorio_medico":
    case "parecer_tecnico":
      return <TextoLivreForm {...props} />;
    case "laudo_medicamento_especializado":
      return <LmeForm {...props} />;
    default:
      return null;
  }
}

// Valida se o documento tem o mínimo necessário para ser emitido.
export function canIssueDocument(
  documentType: DocumentType,
  data: { items: PrescriptionItem[]; payload: Record<string, any>; cid: CidResult | null },
): boolean {
  const { items, payload } = data;
  switch (documentType) {
    case "receita_simples":
    case "receita_controle_especial":
    case "receita_antimicrobiano":
      return items.length > 0;
    case "atestado":
      return !!payload.motivo;
    case "declaracao_comparecimento":
      return !!payload.data;
    case "declaracao_acompanhante":
      return !!(payload.acompanhanteNome && String(payload.acompanhanteNome).trim());
    case "solicitacao_exames":
      return Array.isArray(payload.exames) && payload.exames.length > 0;
    case "encaminhamento":
      return !!(payload.especialidade && String(payload.especialidade).trim());
    case "laudo_medico":
    case "relatorio_medico":
    case "parecer_tecnico":
      return !!(payload.texto && String(payload.texto).trim());
    case "laudo_medicamento_especializado":
      return !!(payload.medicamento && String(payload.medicamento).trim());
    default:
      return false;
  }
}
