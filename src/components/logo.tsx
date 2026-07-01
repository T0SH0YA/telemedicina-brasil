export function Logo({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div className="flex items-center gap-2.5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-soft">
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
            <path
              d="M12 3v18M3 12h18"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            <path
              d="M7.5 16.5c1.8 1.6 4.2 2 6.5 1 2.4-1 3.5-3.2 3-5.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              opacity="0.55"
            />
          </svg>
        </span>
        <div className="leading-none">
          <p className="font-display text-[15px] font-bold tracking-tight text-foreground">
            Receita<span className="text-primary">Já</span>
          </p>
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Teleprescrição
          </p>
        </div>
      </div>
    </div>
  );
}
