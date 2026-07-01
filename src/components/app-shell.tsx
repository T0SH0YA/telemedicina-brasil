import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  FilePlus2,
  ScrollText,
  Users,
  Menu,
  Plus,
  Bell,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { doctor, initials } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/nova-prescricao", label: "Nova prescrição", icon: FilePlus2 },
  { to: "/historico", label: "Histórico", icon: ScrollText },
  { to: "/pacientes", label: "Pacientes", icon: Users },
] as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="flex flex-col gap-1">
      {nav.map((item) => {
        const active =
          "exact" in item && item.exact ? pathname === item.to : pathname.startsWith(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-soft"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <item.icon className="h-[18px] w-[18px]" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function DoctorCard() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-sidebar-border bg-sidebar-accent/50 p-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary font-display text-sm font-bold text-primary-foreground">
        {initials(doctor.name)}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-sidebar-foreground">{doctor.name}</p>
        <p className="truncate text-xs text-muted-foreground">{doctor.crm}</p>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen w-full bg-background">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col justify-between border-r border-sidebar-border bg-sidebar p-4 lg:flex">
        <div className="space-y-6">
          <div className="px-1 pt-1">
            <Logo />
          </div>
          <NavLinks />
        </div>
        <DoctorCard />
      </aside>

      {/* Conteúdo */}
      <div className="lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-md sm:px-6">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 border-sidebar-border bg-sidebar p-4">
              <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
              <div className="flex h-full flex-col justify-between">
                <div className="space-y-6">
                  <Logo />
                  <NavLinks onNavigate={() => setMobileOpen(false)} />
                </div>
                <DoctorCard />
              </div>
            </SheetContent>
          </Sheet>

          <div className="lg:hidden">
            <Logo />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative text-muted-foreground" aria-label="Notificações">
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
            </Button>
            <Button asChild className="hidden sm:inline-flex">
              <Link to="/nova-prescricao">
                <Plus className="h-4 w-4" /> Nova prescrição
              </Link>
            </Button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
