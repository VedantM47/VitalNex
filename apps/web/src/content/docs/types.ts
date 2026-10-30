// Admin documentation content (English only, docs/DECISIONS.md D-27). Each page is plain data;
// components/docs/DocBlocks.tsx renders it. Inline text supports **bold**, `code` and [label](href).

export type NitiId =
  | "safety_reliability"
  | "equality"
  | "inclusivity_non_discrimination"
  | "privacy_security"
  | "transparency"
  | "accountability"
  | "positive_human_values";

export type CalloutKind = "info" | "tip" | "warning" | "danger";

export type DocBlock =
  /** Section heading; appears in "On this page". `id` is the URL anchor. */
  | { type: "h2"; id: string; text: string }
  | { type: "h3"; text: string }
  | { type: "p"; text: string }
  | { type: "list"; items: string[]; ordered?: boolean }
  /** Numbered how-to steps. */
  | { type: "steps"; items: { title: string; text: string }[] }
  | { type: "callout"; kind: CalloutKind; title?: string; text: string }
  /**
   * Screenshot from apps/web/public/docs/... (made by scripts/docs/capture.py).
   * `markers` explain the numbered boxes drawn on the image.
   */
  | { type: "image"; src: string; alt: string; caption?: string; markers?: { n: number; text: string }[] }
  /** NITI Aayog principles this feature follows; the rule text comes from niti.ts. */
  | { type: "niti"; items: { id: NitiId; how: string[] }[] }
  | { type: "code"; lang?: string; code: string }
  | { type: "table"; head: string[]; rows: string[][] }
  /** Question and answer list. */
  | { type: "faq"; items: { q: string; a: string }[] };

export interface DocPage {
  slug: string;
  title: string;
  /** One or two plain sentences shown under the title. */
  summary: string;
  /** Who the page is for, e.g. "Patients" or "Developers". */
  audience?: string;
  blocks: DocBlock[];
}
