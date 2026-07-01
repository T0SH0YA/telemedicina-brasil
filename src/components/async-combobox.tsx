import { useEffect, useRef, useState, type ReactNode } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

interface AsyncComboboxProps<T> {
  placeholder?: string;
  search: (q: string) => Promise<T[]>;
  onSelect: (item: T) => void;
  getKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  minChars?: number;
  autoFocus?: boolean;
  emptyText?: string;
}

export function AsyncCombobox<T>({
  placeholder,
  search,
  onSelect,
  getKey,
  renderItem,
  minChars = 2,
  autoFocus,
  emptyText = "Nenhum resultado.",
}: AsyncComboboxProps<T>) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const reqId = useRef(0);

  useEffect(() => {
    const term = q.trim();
    if (term.length < minChars) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const id = ++reqId.current;
    const t = setTimeout(async () => {
      try {
        const r = await search(term);
        if (id === reqId.current) {
          setResults(r);
          setOpen(true);
        }
      } catch {
        if (id === reqId.current) setResults([]);
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    }, 280);
    return () => clearTimeout(t);
  }, [q, minChars, search]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const showList = open && q.trim().length >= minChars;

  return (
    <div className="relative" ref={boxRef}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        autoFocus={autoFocus}
        placeholder={placeholder}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => q.trim().length >= minChars && setOpen(true)}
        className="pl-9 pr-9"
      />
      {loading && (
        <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
      )}
      {showList && (
        <div className="absolute z-20 mt-1 max-h-72 w-full space-y-1 overflow-y-auto rounded-xl border border-border bg-popover p-1 shadow-card">
          {results.length === 0 && !loading ? (
            <p className="px-2 py-3 text-center text-xs text-muted-foreground">{emptyText}</p>
          ) : (
            results.map((item) => (
              <button
                key={getKey(item)}
                type="button"
                onClick={() => {
                  onSelect(item);
                  setQ("");
                  setResults([]);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-lg p-2 text-left transition-colors hover:bg-muted"
              >
                {renderItem(item)}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
