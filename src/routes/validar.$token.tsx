import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, ShieldAlert, Loader2, CalendarDays, User, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { docMeta } from "@/lib/document-types";
import type { DocumentType } from "@/lib/types";
import { Logo } from "@/components/logo";

export const Route = createFileRoute("/validar/$token")({
  head: () => ({
    meta: [
      { title: "Validar documento — ReceitaJá" },
      { name: "description", content: "Verifique a autenticidade de um documento médico emitido no ReceitaJá." },
    ],
  }),
  component: ValidarPage,
});

interface ValidationData {
  patient_name: string | null;
  document_type: string | null;
  doc_type: string | null;
  status: string | null;
  issued_at: string | null;
  created_at: string | null;
  cid_codigo: string | null;
}

async function fetchDocument(token: string): Promise<ValidationData | null> {
  const { data, error } = await supabase
    .from("prescriptions")
    .select("patient_name, document_type, doc_type, status, issued_at, created_at, cid_codigo")
    .eq("validation_token", token)
    .maybeSingle();
  if (error) throw error;
  return (data as ValidationData | null) ?? null;
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short" });
}

function ValidarPage() {
  const { token } = Route.useParams();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["validar", token],
    queryFn: () => fetchDocument(token),
    retry: false,
  });

  const docLabel = data?.document_type
    ? docMeta(data.document_type as DocumentType)?.label ?? data.document_type
    : "Documento médico";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8">
          {isLoading ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Verificando autenticidade…</p>
            </div>
          ) : data && !isError ? (
            <div className="space-y-5">
              <div className="flex flex-col items-center gap-2 text-center">
                <span className="grid h-14 w-14 place-items-center rounded-full bg-success/15 text-success">
                  <ShieldCheck className="h-7 w-7" />
                </span>
                <h1 className="font-display text-xl font-bold text-foreground">Documento autêntico</h1>
                <p className="text-sm text-muted-foreground">
                  Este documento foi emitido no ReceitaJá e consta em nossos registros.
                </p>
              </div>

              <dl className="space-y-3 rounded-2xl border border-border bg-muted/30 p-4 text-sm">
                <div className="flex items-start gap-3">
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <dt className="text-xs text-muted-foreground">Tipo de documento</dt>
                    <dd className="font-medium text-foreground">{docLabel}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <User className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <dt className="text-xs text-muted-foreground">Paciente</dt>
                    <dd className="font-medium text-foreground">{data.patient_name ?? "—"}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <dt className="text-xs text-muted-foreground">Emitido em</dt>
                    <dd className="font-medium text-foreground">
                      {formatDate(data.issued_at ?? data.created_at)}
                    </dd>
                  </div>
                </div>
              </dl>

              <div className="rounded-xl bg-muted px-3 py-2 text-center">
                <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Código de validação
                </span>
                <p className="font-mono text-sm font-semibold text-foreground">{token}</p>
              </div>

              <p className="text-center text-xs text-muted-foreground">
                A validade jurídica depende da assinatura digital ICP-Brasil aplicada ao documento.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-destructive/10 text-destructive">
                <ShieldAlert className="h-7 w-7" />
              </span>
              <h1 className="font-display text-xl font-bold text-foreground">Documento não encontrado</h1>
              <p className="text-sm text-muted-foreground">
                Não localizamos nenhum documento com o código
                <span className="mx-1 font-mono font-semibold text-foreground">{token}</span>.
                Verifique o link ou o QR Code recebido.
              </p>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          ReceitaJá · Verificação pública de autenticidade
        </p>
      </div>
    </div>
  );
}
