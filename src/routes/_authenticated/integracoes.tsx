import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, MessageCircle, Save, Info } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Labeled } from "@/components/documents/form-shared";
import {
  getVidaasConfig,
  setVidaasConfig,
  isVidaasConfigured,
  type VidaasConfig,
} from "@/lib/signature";
import {
  getWhatsappConfig,
  setWhatsappConfig,
  isCloudConfigured,
  type WhatsappConfig,
} from "@/lib/whatsapp";

export const Route = createFileRoute("/_authenticated/integracoes")({
  head: () => ({
    meta: [
      { title: "Integrações — ReceitaJá" },
      { name: "description", content: "Configure a assinatura digital VIDaaS e o envio por WhatsApp." },
    ],
  }),
  component: IntegracoesPage,
});

function IntegracoesPage() {
  const [vidaas, setVidaas] = useState<VidaasConfig>(() => getVidaasConfig());
  const [whats, setWhats] = useState<WhatsappConfig>(() => getWhatsappConfig());

  const saveVidaas = () => {
    setVidaasConfig(vidaas);
    toast.success("Configuração da assinatura salva");
  };
  const saveWhats = () => {
    setWhatsappConfig(whats);
    toast.success("Configuração do WhatsApp salva");
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold text-foreground">Integrações</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure a assinatura digital ICP-Brasil e o envio de documentos por WhatsApp.
        </p>
      </header>

      <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          As chaves ficam salvas apenas neste navegador. A assinatura VIDaaS e o WhatsApp Cloud
          exigem contratação junto à Valid e à Meta; enquanto não configurados, o app usa o modo
          básico (link/QR e WhatsApp pelo seu próprio número).
        </span>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="mb-4 flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div>
            <h2 className="font-semibold text-foreground">Assinatura digital (VIDaaS / IntegraICP)</h2>
            <p className="text-xs text-muted-foreground">
              Status: {isVidaasConfigured(vidaas) ? "configurada" : "não configurada"}
            </p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Labeled label="Base da API">
            <Input
              value={vidaas.baseUrl}
              onChange={(e) => setVidaas({ ...vidaas, baseUrl: e.target.value })}
              placeholder="https://services.integraicp.com.br"
            />
          </Labeled>
          <Labeled label="client_id">
            <Input
              value={vidaas.clientId}
              onChange={(e) => setVidaas({ ...vidaas, clientId: e.target.value })}
              placeholder="ID do aplicativo"
            />
          </Labeled>
          <Labeled label="API Key (Valid)">
            <Input
              value={vidaas.apiKey}
              onChange={(e) => setVidaas({ ...vidaas, apiKey: e.target.value })}
              placeholder="Chave fornecida pela Valid"
            />
          </Labeled>
          <Labeled label="Redirect URI">
            <Input
              value={vidaas.redirectUri}
              onChange={(e) => setVidaas({ ...vidaas, redirectUri: e.target.value })}
              placeholder="URL de callback"
            />
          </Labeled>
        </div>
        <Button className="mt-4" onClick={saveVidaas}>
          <Save className="h-4 w-4" /> Salvar assinatura
        </Button>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="mb-4 flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
            <MessageCircle className="h-4 w-4" />
          </span>
          <div>
            <h2 className="font-semibold text-foreground">WhatsApp</h2>
            <p className="text-xs text-muted-foreground">
              Modo: {isCloudConfigured(whats) ? "Cloud API (número dedicado)" : "link wa.me (seu número)"}
            </p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Labeled label="phone_number_id">
            <Input
              value={whats.phoneNumberId}
              onChange={(e) => setWhats({ ...whats, phoneNumberId: e.target.value, mode: "cloud" })}
              placeholder="ID do número (Meta)"
            />
          </Labeled>
          <Labeled label="Access token (Meta)">
            <Input
              value={whats.accessToken}
              onChange={(e) => setWhats({ ...whats, accessToken: e.target.value, mode: "cloud" })}
              placeholder="Token permanente"
            />
          </Labeled>
          <Labeled label="Nome do template">
            <Input
              value={whats.templateName}
              onChange={(e) => setWhats({ ...whats, templateName: e.target.value })}
              placeholder="envio_receita"
            />
          </Labeled>
          <Labeled label="Idioma do template">
            <Input
              value={whats.templateLang}
              onChange={(e) => setWhats({ ...whats, templateLang: e.target.value })}
              placeholder="pt_BR"
            />
          </Labeled>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={saveWhats}>
            <Save className="h-4 w-4" /> Salvar WhatsApp
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const next = { ...whats, mode: "deeplink" as const };
              setWhats(next);
              setWhatsappConfig(next);
              toast.success("Voltou ao modo link wa.me");
            }}
          >
            Usar modo básico (wa.me)
          </Button>
        </div>
      </section>
    </div>
  );
}
