// Client-side analytics helpers. Safe no-ops when pixel/gtag aren't loaded
// (build target, ad-blockers, SSR, etc.) so callers don't need to guard.

declare global {
  interface Window {
    fbq?: (
      method: string,
      eventNameOrId: string,
      params?: Record<string, unknown>,
    ) => void;
    gtag?: (
      command: string,
      action: string,
      params?: Record<string, unknown>,
    ) => void;
    dataLayer?: unknown[];
  }
}

export function trackFbEvent(
  eventName: string,
  params?: Record<string, unknown>,
): void {
  if (typeof window === "undefined") return;
  if (typeof window.fbq !== "function") return;
  try {
    window.fbq("track", eventName, params);
  } catch {
    /* swallow analytics failures */
  }
}

export function trackGaEvent(
  eventName: string,
  params?: Record<string, unknown>,
): void {
  if (typeof window === "undefined") return;
  if (typeof window.gtag !== "function") return;
  try {
    window.gtag("event", eventName, params);
  } catch {
    /* swallow analytics failures */
  }
}

export function trackLead(value: number = 0, currency: string = "USD"): void {
  trackFbEvent("Lead", { value, currency });
  trackGaEvent("generate_lead", { value, currency });
}

export function trackFunnelStep(step: number, label: string): void {
  trackFbEvent("ViewContent", { content_name: label, step });
  trackGaEvent("funnel_step", { step, label });
}
