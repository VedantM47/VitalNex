/**
 * Display helpers for numbers that come from the API. A value the API did not compute (null,
 * undefined or the string "not available") is never turned into a number: callers get null and
 * show the translated "not available" text (CLAUDE.md hard rule 4).
 */

export const NOT_AVAILABLE = "not available";

export function locale(lang: string): string {
  return lang === "en" ? "en-IN" : `${lang}-IN`;
}

export function isNum(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

/** 0.1234 -> "12.3%" (or null when not computed). */
export function pct(v: unknown, digits = 1): string | null {
  return isNum(v) ? `${(v * 100).toFixed(digits)}%` : null;
}

/** Fixed decimals (or null when not computed). */
export function dec(v: unknown, digits = 3): string | null {
  return isNum(v) ? v.toFixed(digits) : null;
}

/** [lo, hi] confidence interval -> "0.812–0.830" (or null). */
export function ci(v: unknown, digits = 3, asPct = false): string | null {
  if (!Array.isArray(v) || v.length !== 2 || !isNum(v[0]) || !isNum(v[1])) return null;
  const f = (x: number) => (asPct ? `${(x * 100).toFixed(1)}%` : x.toFixed(digits));
  return `${f(v[0])}–${f(v[1])}`;
}

export function dateTime(v: unknown, lang: string): string | null {
  if (typeof v !== "string" || !v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString(locale(lang), { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function dateOnly(v: unknown, lang: string): string | null {
  if (typeof v !== "string" || !v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(locale(lang), { year: "numeric", month: "short", day: "numeric" });
}

/** A value from the API that may be the literal "not available". */
export function available<T>(v: T | typeof NOT_AVAILABLE | null | undefined): v is T {
  return v !== null && v !== undefined && v !== NOT_AVAILABLE;
}
