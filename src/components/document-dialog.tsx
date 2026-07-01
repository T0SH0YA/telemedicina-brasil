import { Download, Send } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PrescriptionDocument } from "@/components/prescription-document";
import type { Prescription } from "@/lib/mock-data";

export function DocumentDialog({
  rx,
  open,
  onOpenChange,
  onSend,
}: {
  rx: Prescription | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSend?: (rx: Prescription) => void;
}) {
  if (!rx) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] gap-0 overflow-y-auto border-none bg-muted/40 p-4 sm:max-w-3xl sm:p-6">
        <div className="no-print mb-4 flex flex-wrap items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Download className="h-4 w-4" /> Baixar PDF
          </Button>
          {rx.status !== "cancelada" && onSend && (
            <Button size="sm" onClick={() => onSend(rx)}>
              <Send className="h-4 w-4" /> Enviar
            </Button>
          )}
        </div>
        <PrescriptionDocument rx={rx} />
      </DialogContent>
    </Dialog>
  );
}
