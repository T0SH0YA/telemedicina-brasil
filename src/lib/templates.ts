// Biblioteca de modelos reutilizáveis (Bloco 2).
// Usa a tabela prescription_templates (RLS: cada médico vê só os seus).
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PrescriptionItem } from "./types";

export interface PrescriptionTemplate {
  id: string;
  title: string;
  notes: string | null;
  items: PrescriptionItem[];
  createdAt: string;
}

export interface NewTemplateInput {
  title: string;
  notes?: string | null;
  items: PrescriptionItem[];
}

function mapTemplate(row: any): PrescriptionTemplate {
  return {
    id: row.id,
    title: row.title,
    notes: row.notes ?? null,
    items: Array.isArray(row.items) ? (row.items as PrescriptionItem[]) : [],
    createdAt: row.created_at,
  };
}

async function fetchTemplates(): Promise<PrescriptionTemplate[]> {
  const { data, error } = await supabase
    .from("prescription_templates")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapTemplate);
}

async function insertTemplate(input: NewTemplateInput): Promise<PrescriptionTemplate> {
  const { data: userData } = await supabase.auth.getUser();
  const ownerId = userData.user?.id;
  if (!ownerId) throw new Error("Sessão expirada. Faça login novamente.");
  const { data, error } = await supabase
    .from("prescription_templates")
    .insert({
      owner_id: ownerId,
      title: input.title,
      notes: input.notes || null,
      items: (input.items ?? []) as any,
    })
    .select()
    .single();
  if (error) throw error;
  return mapTemplate(data);
}

async function deleteTemplate(id: string): Promise<void> {
  const { error } = await supabase.from("prescription_templates").delete().eq("id", id);
  if (error) throw error;
}

export function useTemplates() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["templates"], queryFn: fetchTemplates });

  const save = useMutation({
    mutationFn: insertTemplate,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["templates"] }),
  });

  const remove = useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["templates"] }),
  });

  return {
    templates: q.data ?? [],
    loading: q.isLoading,
    error: q.error ?? null,
    saveTemplate: (input: NewTemplateInput) => save.mutateAsync(input),
    deleteTemplate: (id: string) => remove.mutateAsync(id),
    saving: save.isPending,
  };
}
