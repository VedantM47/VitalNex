"use client";

import { createContext, useContext } from "react";

/** Admin copy of the docs. Page content links to it; DocsBaseContext rewrites those links. */
export const ADMIN_DOCS_BASE = "/admin/docs";
/** Public copy of the docs (no sign-in). */
export const PUBLIC_DOCS_BASE = "/documentation";

export const DocsBaseContext = createContext<string>(ADMIN_DOCS_BASE);

export function useDocsBase(): string {
  return useContext(DocsBaseContext);
}

/** `/admin/docs/x` written in page content becomes `<base>/x` for the copy being viewed. */
export function docsHref(base: string, href: string): string {
  return href === ADMIN_DOCS_BASE || href.startsWith(`${ADMIN_DOCS_BASE}/`) || href.startsWith(`${ADMIN_DOCS_BASE}#`)
    ? base + href.slice(ADMIN_DOCS_BASE.length)
    : href;
}
