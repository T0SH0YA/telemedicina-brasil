import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  FilePlus2,
  ScrollText,
  Users,
  Send,
  ArrowUpRight,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { useRx } from "@/lib/rx-store";
import { Button } from "@/components/ui/button";
import { StatusBadge, TypeBadge } from "@/components/status-badge";
import { DocumentDialog } from "@/components/document-dialog";
import { SendDialog } from "@/components/send-dialog";
import {
  doctor,
  formatDateTime,
  initials,
  type Prescription,
} from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — ReceitaJá" },
      { name: "description", content: "Visão geral das prescrições, pacientes e envios recentes." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { prescriptions, patients } = useRx();
  const [viewing, setViewing] = useState<Prescription | null>(null);
  const [sending, setSending] = useState<Prescription | null>(null);

  const today = new Date().toDateString();
  const emitidas = prescriptions.filter((p) => p.status !== "cancelada").length;
  const enviadasHoje = prescriptions.filter(
    (p) => p.status === "enviada" && new Date(p.createdAt).toDateString() === today,
  ).length;
  const controle = prescriptions.filter((p) => p.type === "controle_especial").length;

  const stats = [
    { label: "Prescrições emitidas", value: emitidas, icon: ScrollText, to: "/historico" },
    { label: "Pacientes ativos", value: patients.length, icon: Users, to: "/pacientes" },
    { label: "Enviadas hoje", value: enviadasHoje, icon: Send, to: "/historico" },
    { label: "Controle especial", value: controle, icon: ShieldCheck, to: "/historico" },
  ] as const;

  const recent = prescriptions.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="rx-grid overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-lg">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-success" /> Assinatura digital ativa
            </span>
            <h1 className="mt-3 font-display text-2xl font-bold text-foreground sm:text-3xl">
              Olá, {doctor.name.split(" ")[0]} {doctor.name.split(" ")[1]}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Emita, assine e envie prescrições médicas em poucos cliques — tudo em um só lugar.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button asChild>
                <Link to="/nova-prescricao">
                  <FilePlus2 className="h-4 w-4" /> Nova prescrição
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/pacientes">
                  <Users className="h-4 w-4" /> Ver pacientes
                </Link>
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-background/70 p-4 backdrop-blur">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary font-display text-base font-bold text-primary-foreground">
              {initials(doctor.name)}
            </span>
            <div className="text-sm">
              <p className="font-semibold text-foreground">{doctor.specialty}</p>
              <p className="text-muted-foreground">{doctor.crm}</p>
              <p className="text-muted-foreground">{doctor.clinic}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            to={s.to}
            className="group rounded-2xl border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card"
          >
            <div className="flex items-center justify-between">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-accent-foreground">
                <s.icon className="h-5 w-5" />
              </span>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
            </div>
            <p className="mt-4 font-display text-3xl font-bold text-foreground">{s.value}</p>
            <p className="text-sm text-muted-foreground">{s.label}</p>
          </Link>
        ))}
      </section>

      {/* Recentes */}
      <section className="rounded-2xl border border-border bg-card shadow-soft">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-display text-lg font-bold text-foreground">Prescrições recentes</h2>
          <Link
            to="/historico"
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Ver todas <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <ul className="divide-y divide-border">
          {recent.map((rx) => (
            <li
              key={rx.id}
              className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <button
                onClick={() => setViewing(rx)}
                className="flex min-w-0 items-center gap-3 text-left"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary font-display text-xs font-bold text-secondary-foreground">
                  {initials(rx.patientName)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-foreground">
                    {rx.patientName}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {rx.items.length} item(ns) · {formatDateTime(rx.createdAt)}
                  </span>
                </span>
              </button>
              <div className="flex items-center gap-2 sm:justify-end">
                <TypeBadge type={rx.type} />
                <StatusBadge status={rx.status} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <DocumentDialog
        rx={viewing}
        open={!!viewing}
        onOpenChange={(v) => !v && setViewing(null)}
        onSend={(rx) => {
          setViewing(null);
          setSending(rx);
        }}
      />
      <SendDialog rx={sending} open={!!sending} onOpenChange={(v) => !v && setSending(null)} />
    </div>
  );
}
