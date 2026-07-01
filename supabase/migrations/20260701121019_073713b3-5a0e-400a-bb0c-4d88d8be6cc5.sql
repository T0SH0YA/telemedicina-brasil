-- 1) Enum com todos os tipos de documento médico
DO $$ BEGIN
  CREATE TYPE public.document_type AS ENUM (
    'receita_simples',
    'receita_controle_especial',
    'receita_antimicrobiano',
    'atestado',
    'declaracao_comparecimento',
    'declaracao_acompanhante',
    'laudo_medico',
    'relatorio_medico',
    'solicitacao_exames',
    'encaminhamento',
    'parecer_tecnico',
    'laudo_medicamento_especializado'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2) Tabela prescriptions passa a ser a tabela de "documentos" de forma retrocompatível.
--    Adiciona document_type (default receita_simples) e payload (dados específicos por tipo).
--    Mantém code (validation_token), status, doc_type e prescription_items funcionando.
ALTER TABLE public.prescriptions
  ADD COLUMN IF NOT EXISTS document_type public.document_type NOT NULL DEFAULT 'receita_simples',
  ADD COLUMN IF NOT EXISTS payload jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 3) Backfill dos registros já existentes a partir do doc_type antigo (idempotente)
UPDATE public.prescriptions
SET document_type = CASE
  WHEN doc_type = 'controle_especial' THEN 'receita_controle_especial'::public.document_type
  ELSE 'receita_simples'::public.document_type
END
WHERE document_type = 'receita_simples' AND doc_type = 'controle_especial';

-- doc_type continua NOT NULL; para documentos não-receita usaremos 'simples' como placeholder.
