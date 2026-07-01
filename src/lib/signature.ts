/**
 * Assinatura eletrônica ICP-Brasil via VIDaaS / IntegraICP (Valid).
 *
 * Este módulo é um SCAFFOLD de integração: ele define a configuração,
 * o fluxo de autorização PKCE e a montagem da requisição de assinatura,
 * mas NÃO realiza chamadas reais enquanto as credenciais comerciais
 * (API Key / channel) não forem contratadas junto à Valid Certificadora.
 *
 * Docs: https://developers.integraicp.com.br (API v3).
 */

export interface VidaasConfig {
  /** Base da API IntegraICP, ex.: https://services.integraicp.com.br */
  baseUrl: string;
  /** API Key / channel fornecido pela Valid (contratação comercial). */
  apiKey: string;
  /** client_id do aplicativo registrado. */
  clientId: string;
  /** URL de callback registrada (redirect_uri). */
  redirectUri: string;
  /** Política de assinatura: CMS (PKCS#7) ou RAW. */
  signaturePolicy: "CMS" | "RAW";
}

const STORAGE_KEY = "receitaja:vidaas-config";

const DEFAULT_CONFIG: VidaasConfig = {
  baseUrl: "https://services.integraicp.com.br",
  apiKey: "",
  clientId: "",
  redirectUri: typeof window !== "undefined" ? window.location.origin + "/assinatura/callback" : "",
  signaturePolicy: "CMS",
};

/** Lê a configuração salva (localStorage) mesclada com os padrões. */
export function getVidaasConfig(): VidaasConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    return { ...DEFAULT_CONFIG, ...(JSON.parse(raw) as Partial<VidaasConfig>) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

/** Salva a configuração informada pelo usuário. */
export function setVidaasConfig(patch: Partial<VidaasConfig>): VidaasConfig {
  const next = { ...getVidaasConfig(), ...patch };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}

/** Indica se as credenciais mínimas estão presentes. */
export function isVidaasConfigured(cfg: VidaasConfig = getVidaasConfig()): boolean {
  return Boolean(cfg.apiKey && cfg.clientId);
}

/* ------------------------------------------------------------------ */
/* PKCE helpers                                                        */
/* ------------------------------------------------------------------ */

function base64url(bytes: ArrayBuffer): string {
  const arr = new Uint8Array(bytes);
  let str = "";
  for (const b of arr) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function sha256(input: string | ArrayBuffer): Promise<ArrayBuffer> {
  const data = typeof input === "string" ? new TextEncoder().encode(input) : input;
  return crypto.subtle.digest("SHA-256", data);
}

export async function createPkcePair(): Promise<{ verifier: string; challenge: string }> {
  const random = new Uint8Array(32);
  crypto.getRandomValues(random);
  const verifier = base64url(random.buffer);
  const challenge = base64url(await sha256(verifier));
  return { verifier, challenge };
}

/* ------------------------------------------------------------------ */
/* Fluxo de autorização (VIDaaS abre o app do certificado no celular)  */
/* ------------------------------------------------------------------ */

const NOT_CONFIGURED =
  "Assinatura VIDaaS ainda não configurada. Informe API Key e client_id da Valid nas configurações.";

/**
 * Monta a URL de autorização PKCE. O usuário aprova a assinatura no
 * aplicativo VIDaaS; o provedor redireciona para redirectUri com um code.
 */
export async function buildAuthorizationUrl(scope = "signature_session"): Promise<string> {
  const cfg = getVidaasConfig();
  if (!isVidaasConfigured(cfg)) throw new Error(NOT_CONFIGURED);
  const { verifier, challenge } = await createPkcePair();
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem("receitaja:pkce-verifier", verifier);
  }
  const params = new URLSearchParams({
    response_type: "code",
    client_id: cfg.clientId,
    redirect_uri: cfg.redirectUri,
    scope,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });
  return cfg.baseUrl + "/v3/oauth/authorize?" + params.toString();
}

export interface SignRequest {
  /** Conteúdo do documento (texto do PDF/registro) a ser assinado. */
  content: string;
  /** credentialId retornado no callback da autorização. */
  credentialId: string;
  /** access_token obtido na troca do code. */
  accessToken: string;
}

export interface SignResult {
  signatureValue: string;
  signedAt: string;
  policy: VidaasConfig["signaturePolicy"];
}

/**
 * Envia o hash do documento para assinatura. Requer credenciais reais;
 * enquanto não houver contratação, lança erro claro em vez de simular.
 */
export async function signDocument(req: SignRequest): Promise<SignResult> {
  const cfg = getVidaasConfig();
  if (!isVidaasConfigured(cfg)) throw new Error(NOT_CONFIGURED);
  const digest = base64url(await sha256(req.content));
  const res = await fetch(cfg.baseUrl + "/v3/signatures", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + req.accessToken,
      "X-Api-Key": cfg.apiKey,
    },
    body: JSON.stringify({
      credentialId: req.credentialId,
      hashes: [{ contentDigest: digest, hashAlgorithmOID: "2.16.840.1.101.3.4.2.1" }],
      signaturePolicy: cfg.signaturePolicy,
    }),
  });
  if (!res.ok) {
    throw new Error("Falha na assinatura VIDaaS (" + res.status + ").");
  }
  const data = (await res.json()) as { signatures?: string[] };
  return {
    signatureValue: data.signatures?.[0] ?? "",
    signedAt: new Date().toISOString(),
    policy: cfg.signaturePolicy,
  };
}
