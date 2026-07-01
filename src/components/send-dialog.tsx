import { useState } from "react";
import { MessageCircle, Mail, Link2, Check, Copy } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRx } from "@/lib/rx-store";
import type { Prescription } from "@/lib/mock-data";

const channels = [
  { id: "WhatsApp", label: "WhatsApp", icon: MessageCircle, hint: "Envia o link seguro por mensagem" },
  { id: "E-mail", label: "E-mail", icon: Mail, hint: "Encaminha o PDF para o e-mail do paciente" },
  { id: "Link", label: "Link / QR Code", icon: Link2, hint: "Gera link e QR de acesso" },
];

export function SendDialog({
  rx,
  open,
  onOpenChange,
}: {
  rx: Prescription | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { markSent } = useRx();
  const [selected, setSelected] = useState<string>("WhatsApp");
  const [sent, setSent] = useState(false);

  if (!rx) return null;
  const link = `https://receitaja.exemplo.com/validar/${rx.code}`;

  const handleSend = () => {
    markSent(rx.id, selected);
    setSent(true);
    toast.success(`Prescrição enviada por ${selected} (simulado)`);
  };

  const handleClose = (v: boolean) => {
    if (!v) setSent(false);
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enviar ao paciente</DialogTitle>
          <DialogDescription>
            {rx.patientName} · {rx.code}
          </DialogDescription>
        </DialogHeader>

        {!sent ? (
          <div className="space-y-2">
            {channels.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected(c.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                  selected === c.id
                    ? "border-primary bg-accent/60"
                    : "border-border hover:bg-muted/60",
                )}
              >
                <span
                  className={cn(
                    "grid h-9 w-9 place-items-center rounded-lg",
                    selected === c.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                  )}
                >
                  <c.icon className="h-4 w-4" />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-semibold text-foreground">{c.label}</span>
                  <span className="block text-xs text-muted-foreground">{c.hint}</span>
                </span>
                {selected === c.id && <Check className="h-4 w-4 text-primary" />}
              </button>
            ))}
            <Button className="mt-2 w-full" onClick={handleSend}>
              Enviar por {selected}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-2 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-success/15 text-success">
              <Check className="h-6 w-6" />
            </span>
            <div>
              <p className="font-display font-semibold text-foreground">Enviada com sucesso</p>
              <p className="text-sm text-muted-foreground">
                O paciente recebeu o acesso por {selected}.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-3">
              <QRCodeSVG value={link} size={120} fgColor="#0f3b3f" bgColor="transparent" />
            </div>
            <div className="flex w-full items-center gap-2 rounded-lg bg-muted px-3 py-2">
              <span className="flex-1 truncate text-xs text-muted-foreground">{link}</span>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(link);
                  toast.success("Link copiado");
                }}
                className="shrink-0 text-muted-foreground hover:text-foreground"
                aria-label="Copiar link"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <Button variant="outline" className="w-full" onClick={() => handleClose(false)}>
              Concluir
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
