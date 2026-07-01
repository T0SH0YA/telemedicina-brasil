CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ========== CID-10 (referência oficial DATASUS) ==========
CREATE TABLE IF NOT EXISTS public.cid10 (
  codigo text PRIMARY KEY,
  descricao text NOT NULL,
  descricao_abrev text,
  categoria text,
  capitulo integer,
  capitulo_descricao text,
  nivel text NOT NULL DEFAULT 'subcategoria',
  busca tsvector GENERATED ALWAYS AS (to_tsvector('portuguese', coalesce(descricao,''))) STORED,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cid10 TO anon, authenticated;
GRANT ALL ON public.cid10 TO service_role;
ALTER TABLE public.cid10 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "CID-10 leitura publica" ON public.cid10 FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_cid10_codigo_prefix ON public.cid10 (codigo text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_cid10_descricao_trgm ON public.cid10 USING gin (descricao gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_cid10_busca ON public.cid10 USING gin (busca);

-- ========== Medicamentos (referência oficial ANVISA) ==========
CREATE TABLE IF NOT EXISTS public.medicamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  produto text NOT NULL,
  substancia text,
  apresentacao text,
  laboratorio text,
  classe_terapeutica text,
  categoria_regulatoria text,
  tipo public.drug_kind,
  tarja text,
  controlado boolean NOT NULL DEFAULT false,
  registro text,
  situacao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT medicamentos_registro_produto_key UNIQUE (registro, produto)
);
GRANT SELECT ON public.medicamentos TO anon, authenticated;
GRANT ALL ON public.medicamentos TO service_role;
ALTER TABLE public.medicamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Medicamentos leitura publica" ON public.medicamentos FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_medicamentos_produto_trgm ON public.medicamentos USING gin (produto gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_medicamentos_substancia_trgm ON public.medicamentos USING gin (substancia gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_medicamentos_produto_prefix ON public.medicamentos (produto text_pattern_ops);

-- ========== Limpeza de dados fictícios e religação ==========
ALTER TABLE public.prescription_items DROP CONSTRAINT IF EXISTS prescription_items_medication_id_fkey;
ALTER TABLE public.prescription_items DROP COLUMN IF EXISTS medication_id;
ALTER TABLE public.prescription_items ADD COLUMN IF NOT EXISTS medicamento_id uuid REFERENCES public.medicamentos(id) ON DELETE SET NULL;
DROP TABLE IF EXISTS public.medications;

ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS cid_codigo text;
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS cid_descricao text;