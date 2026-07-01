import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  DatabaseZap,
  Download,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Pill,
  Stethoscope,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { contarReferencias } from "@/lib/reference";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Administração — ReceitaJá" },
      { name: "description", content: "Importe as bases oficiais de CID-10 e medicamentos (ANVISA)." },
    ],
  }),
  component: Admin,
});

interface ImportResult {
  ok: boolean;
  importados?: number;
  categorias?: number;
  subcategorias?: number;
  fonte?: string;
  duracao_ms?: number;
  erros?: string[];
  error?: string;
}

function Admin() {
  const [counts, setCounts] = useState<{ cid10: number; medicamentos: number } | null>(null);
  const [running, setRunning] = useState<null | "cid10" | "medicamentos" | "ambos">(null);
  const [resCid, setResCid] = useState<ImportResult | null>(null);
  const [resMed, setResMed] = useState<ImportResult | null>(null);

  const loadCounts = useCallback(async () => {
    try {
      setCounts(await contarReferencias());
    } catch {
      setCounts(null);
    }
  }, []);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  async function runImport(fn: "import-cid10" | "import-medicamentos"): Promise<ImportResult> {
    const { data, error } = await supabase.functions.invoke(fn, { body: {} });
    if (error) {
      const msg = error.message || "Falha ao executar a função.";
      return { ok: false, error: msg };
    }
    return data as ImportResult;
  }

  async function handleCid() {
    setRunning("cid10");
    setResCid(null);
    try {
      const r = await runImport("import-cid10");
      setResCid(r);
      r.ok
        ? toast.success(`CID-10 importado: ${r.importados ?? 0} códigos.`)
        : toast.error(`CID-10 falhou: ${r.error}`);
    } finally {
      await loadCounts();
      setRunning(null);
    }
  }

  async function handleMed() {
    setRunning("medicamentos");
    setResMed(null);
    try {
      const r = await runImport("import-medicamentos");
      setResMed(r);
      r.ok
        ? toast.success(`Medicamentos importados: ${r.importados ?? 0} produtos.`)
        : toast.error(`Medicamentos falhou: ${r.error}`);
    } finally {
      await loadCounts();
      setRunning(null);
    }
  }

  async function handleBoth() {
    setRunning("ambos");
    setResCid(null);
    setResMed(null);
    try {
      const c = await runImport("import-cid10");
      setResCid(c);
      const m = await runImport("import-medicamentos");
      setResMed(m);
      if (c.ok && m.ok) toast.success("Bases oficiais importadas com sucesso.");
      else toast.error("Alguma importação falhou. Veja os detalhes abaixo.");
    } finally {
      await loadCounts();
      setRunning(null);
    }
  }

  const busy = running !== null;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-foreground">
            <DatabaseZap className="h-6 w-6 text-primary" /> Administração
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Importe as bases oficiais usadas no autocomplete das prescrições.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadCounts} disabled={busy}>
          <RefreshCw className="h-4 w-4" /> Atualizar
        </Button>
      </header>

      {/* Contadores */}
      <div className="grid gap-4 sm:grid-cols-2">
        <CountCard
          icon={Stethoscope}
          label="CID-10"
          value={counts?.cid10 ?? null}
          hint="Categorias e subcategorias (DATASUS)"
        />
        <CountCard
          icon={Pill}
          label="Medicamentos"
          value={counts?.medicamentos ?? null}
          hint="Base de produtos ANVISA"
        />
      </div>

      {/* Ação principal */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <h2 className="font-display font-bold text-foreground">Importar bases oficiais</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A importação roda no backend (Edge Function), sem CORS. Pode levar alguns segundos e faz
          upsert — não duplica registros já existentes.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={handleBoth} disabled={busy}>
            {running === "ambos" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Importar bases oficiais (CID + Medicamentos)
          </Button>
          <Button variant="outline" onClick={handleCid} disabled={busy}>
            {running === "cid10" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Stethoscope className="h-4 w-4" />
            )}
            Só CID-10
          </Button>
          <Button variant="outline" onClick={handleMed} disabled={busy}>
            {running === "medicamentos" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Pill className="h-4 w-4" />
            )}
            Só Medicamentos
          </Button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <ResultCard title="CID-10" res={resCid} />
          <ResultCard title="Medicamentos" res={resMed} />
        </div>
      </div>
    </div>
  );
}

function CountCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | null;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className="mt-2 font-display text-3xl font-bold text-foreground">
        {value === null ? "—" : value.toLocaleString("pt-BR")}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function ResultCard({ title, res }: { title: string; res: ImportResult | null }) {
  if (!res) return null;
  return (
    <div
      className={`rounded-xl border p-3 text-sm ${
        res.ok ? "border-success/30 bg-success/10" : "border-destructive/30 bg-destructive/10"
      }`}
    >
      <p className="flex items-center gap-1.5 font-semibold text-foreground">
        {res.ok ? (
          <CheckCircle2 className="h-4 w-4 text-success" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-destructive" />
        )}
        {title}
      </p>
      {res.ok ? (
        <ul className="mt-1.5 space-y-0.5 text-xs text-muted-foreground">
          {typeof res.importados === "number" && (
            <li>Importados: {res.importados.toLocaleString("pt-BR")}</li>
          )}
          {typeof res.categorias === "number" && (
            <li>Categorias: {res.categorias.toLocaleString("pt-BR")}</li>
          )}
          {typeof res.subcategorias === "number" && (
            <li>Subcategorias: {res.subcategorias.toLocaleString("pt-BR")}</li>
          )}
          {res.fonte && <li>Fonte: {res.fonte}</li>}
          {typeof res.duracao_ms === "number" && <li>Duração: {(res.duracao_ms / 1000).toFixed(1)}s</li>}
          {res.erros && res.erros.length > 0 && (
            <li className="text-warning-foreground">Avisos: {res.erros.length}</li>
          )}
        </ul>
      ) : (
        <p className="mt-1 text-xs text-destructive">{res.error}</p>
      )}
    </div>
  );
}
