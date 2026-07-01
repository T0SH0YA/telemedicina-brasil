import { createContext, useContext, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { fetchDoctorProfile, saveDoctorProfile } from "@/lib/data";
import type { DoctorProfile } from "@/lib/types";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const DoctorContext = createContext<DoctorProfile | null>(null);

export function useDoctor(): DoctorProfile {
  const ctx = useContext(DoctorContext);
  if (!ctx) throw new Error("useDoctor deve ser usado dentro de DoctorProvider");
  return ctx;
}

export function DoctorProvider({ children }: { children: ReactNode }) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["doctor-profile"],
    queryFn: fetchDoctorProfile,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return <Onboarding onDone={() => refetch()} />;
  }

  return <DoctorContext.Provider value={data}>{children}</DoctorContext.Provider>;
}

function Onboarding({ onDone }: { onDone: () => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    crm: "",
    crmUf: "",
    rqe: "",
    specialty: "",
    clinicName: "",
    clinicAddress: "",
    clinicPhone: "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName.trim()) {
      toast.error("Informe seu nome completo.");
      return;
    }
    setSaving(true);
    try {
      await saveDoctorProfile({
        fullName: form.fullName.trim(),
        crm: form.crm.trim(),
        crmUf: form.crmUf.trim().toUpperCase(),
        rqe: form.rqe.trim(),
        specialty: form.specialty.trim(),
        clinicName: form.clinicName.trim(),
        clinicAddress: form.clinicAddress.trim(),
        clinicPhone: form.clinicPhone.trim(),
      });
      toast.success("Perfil salvo com sucesso.");
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível salvar o perfil.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-10">
      <div className="w-full max-w-xl rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8">
        <Logo />
        <div className="mt-5 flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
            <Stethoscope className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-display text-lg font-bold text-foreground">Complete seu perfil</h1>
            <p className="text-sm text-muted-foreground">
              Esses dados aparecem no cabeçalho e na assinatura das prescrições.
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
          <Labeled label="Nome completo *" className="sm:col-span-2">
            <Input value={form.fullName} onChange={set("fullName")} placeholder="Dra. Ana Silva" required />
          </Labeled>
          <Labeled label="CRM">
            <Input value={form.crm} onChange={set("crm")} placeholder="123456" />
          </Labeled>
          <Labeled label="UF do CRM">
            <Input value={form.crmUf} onChange={set("crmUf")} placeholder="SP" maxLength={2} />
          </Labeled>
          <Labeled label="RQE (opcional)">
            <Input value={form.rqe} onChange={set("rqe")} placeholder="45678" />
          </Labeled>
          <Labeled label="Especialidade">
            <Input value={form.specialty} onChange={set("specialty")} placeholder="Clínica Médica" />
          </Labeled>
          <Labeled label="Clínica / Local de atendimento" className="sm:col-span-2">
            <Input value={form.clinicName} onChange={set("clinicName")} placeholder="Clínica Vida" />
          </Labeled>
          <Labeled label="Endereço do atendimento" className="sm:col-span-2">
            <Textarea value={form.clinicAddress} onChange={set("clinicAddress")} rows={2} placeholder="Rua, número — cidade/UF" />
          </Labeled>
          <Labeled label="Telefone">
            <Input value={form.clinicPhone} onChange={set("clinicPhone")} placeholder="(11) 3000-0000" />
          </Labeled>
          <div className="sm:col-span-2">
            <Button type="submit" className="w-full" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Salvar e continuar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Labeled({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={className}>
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
