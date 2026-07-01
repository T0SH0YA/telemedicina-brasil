/**
 * Envio de documentos ao paciente via WhatsApp.
 *
 * Suporta dois modos:
 *  - "deeplink" (padrão): abre o WhatsApp Web/app do próprio médico com a
 *    mensagem pronta (wa.me). Funciona sem contratação e sem número dedicado.
 *  - "cloud": WhatsApp Cloud API da Meta, usando um número dedicado do
 *    aplicativo (igual à Mevo). Exige Meta Business verificado + template
 *    aprovado; por isso fica desativado até a contratação.
 */

export type WhatsappMode = "deeplink" | "cloud";

export interface WhatsappConfig {
  mode: WhatsappMode;
  /** phone_number_id do número dedicado (Cloud API). */
  phoneNumberId: string;
  /** Token de acesso permanente da Meta. */
  accessToken: string;
  /** Nome do template aprovado (ex.: envio_receita). */
  templateName: string;
  /** Código de idioma do template (ex.: pt_BR). */
  templateLang: string;
}

const STORAGE_KEY = "receitaja:whatsapp-config";

const DEFAULT_CONFIG: WhatsappConfig = {
  mode: "deeplink",
  phoneNumberId: "",
  accessToken: "",
  templateName: "envio_receita",
  templateLang: "pt_BR",
};

export function getWhatsappConfig(): WhatsappConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    return { ...DEFAULT_CONFIG, ...(JSON.parse(raw) as Partial<WhatsappConfig>) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function setWhatsappConfig(patch: Partial<WhatsappConfig>): WhatsappConfig {
  const next = { ...getWhatsappConfig(), ...patch };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}

export function isCloudConfigured(cfg: WhatsappConfig = getWhatsappConfig()): boolean {
  return cfg.mode === "cloud" && Boolean(cfg.phoneNumberId && cfg.accessToken);
}

/** Mantém apenas dígitos e garante o DDI 55 quando ausente. */
export function normalizePhone(phone: string): string {
  const digits = (phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("55")) return digits;
  return "55" + digits;
}

export interface SendLinkParams {
  phone: string;
  patientName: string;
  documentLabel: string;
  link: string;
}

export function buildMessage(p: SendLinkParams): string {
  return (
    "Olá, " + p.patientName + "! Seu documento (" + p.documentLabel + ") já está disponível.\n\n" +
    "Acesse com segurança: " + p.link + "\n\n" +
    "Guarde este link para validar a autenticidade do documento."
  );
}

/** Monta o link wa.me com a mensagem pré-preenchida. */
export function buildDeeplink(p: SendLinkParams): string {
  const phone = normalizePhone(p.phone);
  const text = encodeURIComponent(buildMessage(p));
  return "https://wa.me/" + phone + "?text=" + text;
}

export interface WhatsappResult {
  mode: WhatsappMode;
  /** Presente no modo deeplink: URL a ser aberta. */
  deeplink?: string;
  /** Presente no modo cloud: id da mensagem enviada. */
  messageId?: string;
}

/**
 * Envia o link do documento. No modo deeplink retorna a URL wa.me para o
 * chamador abrir. No modo cloud dispara a mensagem via Cloud API (requer
 * credenciais). Nunca simula sucesso: se cloud sem credenciais, faz fallback
 * transparente para deeplink.
 */
export async function sendDocumentLink(p: SendLinkParams): Promise<WhatsappResult> {
  const cfg = getWhatsappConfig();
  if (!isCloudConfigured(cfg)) {
    return { mode: "deeplink", deeplink: buildDeeplink(p) };
  }
  const res = await fetch(
    "https://graph.facebook.com/v20.0/" + cfg.phoneNumberId + "/messages",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + cfg.accessToken,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: normalizePhone(p.phone),
        type: "template",
        template: {
          name: cfg.templateName,
          language: { code: cfg.templateLang },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: p.patientName },
                { type: "text", text: p.documentLabel },
                { type: "text", text: p.link },
              ],
            },
          ],
        },
      }),
    },
  );
  if (!res.ok) {
    throw new Error("Falha no envio pelo WhatsApp Cloud (" + res.status + ").");
  }
  const data = (await res.json()) as { messages?: { id: string }[] };
  return { mode: "cloud", messageId: data.messages?.[0]?.id };
}
