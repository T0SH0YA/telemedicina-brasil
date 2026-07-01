import { useEffect, useState } from "react";
import { Plus, Star, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CidField, Labeled, type DocFormProps } from "./form-shared";

const FAV_KEY = "receitaja:exames-favoritos";

function loadFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(FAV_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function SolicitacaoExamesForm({ payload, setPayload, cid, setCid }: DocFormProps) {
  const exames = (payload.exames as string[]) ?? [];
  const [entry, setEntry] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => setFavorites(loadFavorites()), []);

  function persistFavorites(next: string[]) {
    setFavorites(next);
    try {
      window.localStorage.setItem(FAV_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }

  function addExame(value: string) {
    const v = value.trim();
    if (!v || exames.includes(v)) return;
    setPayload({ exames: [...exames, v] });
    setEntry("");
  }

  function removeExame(v: string) {
    setPayload({ exames: exames.filter((e) => e !== v) });
  }

  function toggleFavorite(v: string) {
    const value = v.trim();
    if (!value) return;
    persistFavorites(
      favorites.includes(value) ? favorites.filter((f) => f !== value) : [...favorites, value],
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <span className="mb-1 block text-xs font-medium text-muted-foreground">Exames solicitados</span>
        <div className="flex gap-2">
          <Input
            placeholder="Ex.: Hemograma completo"
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addExame(entry);
              }
            }}
          />
          <Button type="button" variant="outline" onClick={() => addExame(entry)}>
            <Plus className="h-4 w-4" /> Adicionar
          </Button>
        </div>

        {favorites.length > 0 && (
          <div className="mt-3">
            <p className="mb-1.5 text-[11px] font-medium uppercase text-muted-foreground">Favoritos</p>
            <div className="flex flex-wrap gap-2">
              {favorites.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => addExame(f)}
                  className="rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-foreground hover:bg-accent"
                >
                  + {f}
                </button>
              ))}
            </div>
          </div>
        )}

        {exames.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
            Nenhum exame adicionado ainda.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {exames.map((ex) => {
              const fav = favorites.includes(ex);
              return (
                <li
                  key={ex}
                  className="flex items-center justify-between gap-2 rounded-xl border border-border p-3 text-sm"
                >
                  <span className="min-w-0 truncate font-medium text-foreground">{ex}</span>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => toggleFavorite(ex)}
                      aria-label="Favoritar"
                      className={cn(
                        "p-1 hover:text-warning-foreground",
                        fav ? "text-warning-foreground" : "text-muted-foreground",
                      )}
                    >
                      <Star className={cn("h-4 w-4", fav && "fill-current")} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeExame(ex)}
                      aria-label="Remover"
                      className="p-1 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <CidField cid={cid} setCid={setCid} label="Indicação clínica (CID-10) — opcional" />

      <Labeled label="Observação / justificativa (aplica-se a todas as guias)">
        <textarea
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          rows={3}
          placeholder="Justificativa clínica dos exames solicitados"
          value={(payload.justificativa as string) ?? ""}
          onChange={(e) => setPayload({ justificativa: e.target.value })}
        />
      </Labeled>
    </div>
  );
}
