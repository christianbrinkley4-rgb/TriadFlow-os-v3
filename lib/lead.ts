export type LeadPayload = {
  source: "triadflow-web";
  submittedAt: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  coverageType: string;
  ageBand: string;
  pageUrl: string;
  referrer: string;
  utm: {
    source: string | null;
    medium: string | null;
    campaign: string | null;
    term: string | null;
    content: string | null;
  };
};

export type LeadInput = Omit<
  LeadPayload,
  "source" | "submittedAt" | "pageUrl" | "referrer" | "utm"
>;

const UTM_KEYS = ["source", "medium", "campaign", "term", "content"] as const;

function readUtm(params: URLSearchParams): LeadPayload["utm"] {
  const result = {} as LeadPayload["utm"];
  for (const key of UTM_KEYS) {
    const raw = params.get(`utm_${key}`);
    result[key] = raw && raw.length > 0 ? raw : null;
  }
  return result;
}

export function buildLeadPayload(input: LeadInput): LeadPayload {
  if (typeof window === "undefined") {
    return {
      source: "triadflow-web",
      submittedAt: new Date().toISOString(),
      ...input,
      pageUrl: "",
      referrer: "",
      utm: {
        source: null,
        medium: null,
        campaign: null,
        term: null,
        content: null,
      },
    };
  }
  const params = new URLSearchParams(window.location.search);
  return {
    source: "triadflow-web",
    submittedAt: new Date().toISOString(),
    ...input,
    pageUrl: window.location.href,
    referrer: document.referrer || "",
    utm: readUtm(params),
  };
}

export type SubmitResult =
  | { ok: true; mode: "webhook" }
  | { ok: true; mode: "no-webhook-fallback" }
  | { ok: false; error: string };

const DEFAULT_WEBHOOK_URL =
  "https://hook.us2.make.com/fvxqryg1s9oldjuaf8s4xkoxurmy0zhh";

export async function submitLead(input: LeadInput): Promise<SubmitResult> {
  const payload = buildLeadPayload(input);
  const url = process.env.NEXT_PUBLIC_LEAD_WEBHOOK_URL || DEFAULT_WEBHOOK_URL;

  if (!url || url.length === 0) {
    if (typeof console !== "undefined") {
      console.warn(
        "[lead] NEXT_PUBLIC_LEAD_WEBHOOK_URL is not set — lead captured locally only",
        payload,
      );
    }
    return { ok: true, mode: "no-webhook-fallback" };
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      mode: "cors",
      keepalive: true,
    });
    if (!response.ok) {
      return { ok: false, error: `webhook responded ${response.status}` };
    }
    return { ok: true, mode: "webhook" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return { ok: false, error: message };
  }
}
