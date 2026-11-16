"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";
import { optedOut, sanitizeUrl } from "@/lib/analytics";

/** Contagem de visitas da Vercel, sem username nem parâmetros (ver src/lib/analytics.ts). */
export function PrivateAnalytics() {
  return <Analytics beforeSend={beforeSend} />;
}

function beforeSend(event: BeforeSendEvent): BeforeSendEvent | null {
  if (optedOut(navigator as Navigator & { globalPrivacyControl?: boolean })) return null;
  const url = sanitizeUrl(event.url);
  return url ? { ...event, url } : null;
}
