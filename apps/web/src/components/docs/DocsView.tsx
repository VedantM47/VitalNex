"use client";

// Admin documentation (/admin/docs). Layout follows common product docs: page list with search on
// the left, the page in the middle, "On this page" on the right, previous / next at the bottom.
// Content is English only (docs/DECISIONS.md D-27); the surrounding labels go through i18n.

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, Search } from "lucide-react";
import { AppShell } from "../layout/AppShell";
import { PublicDocsShell } from "./PublicDocsShell";
import { ADMIN_DOCS_BASE, DocsBaseContext, PUBLIC_DOCS_BASE } from "./docs-base";
import { DocBlocks } from "./DocBlocks";
import { DOC_GROUPS, DOC_PAGES, getDoc } from "../../content/docs";
import type { DocPage } from "../../content/docs/types";
import { useTranslation } from "../../lib/i18n";


/** All string values in a block (not its field names). */
function strings(v: unknown): string[] {
  if (typeof v === "string") return [v];
  if (Array.isArray(v)) return v.flatMap(strings);
  if (v && typeof v === "object") return Object.values(v).flatMap(strings);
  return [];
}

/** All searchable words of a page, lower-case. */
function pageText(p: DocPage): string {
  return [p.title, p.summary, ...p.blocks.flatMap(strings)].join(" ").toLowerCase();
}

/** `public` = open to everyone at /documentation; `admin` = inside the admin area at /admin/docs. */
export function DocsView({ slug, mode = "admin" }: { slug: string; mode?: "admin" | "public" }) {
  const { t } = useTranslation();
  const router = useRouter();
  const base = mode === "public" ? PUBLIC_DOCS_BASE : ADMIN_DOCS_BASE;
  const href = (s: string) => `${base}/${s}`;
  const Shell = mode === "public" ? PublicDocsShell : AppShell;
  // The admin frame scrolls inside itself; the public page scrolls the window under a sticky header.
  const stick = mode === "public" ? "top-20" : "top-0";
  const [query, setQuery] = useState("");
  const page = getDoc(slug);
  const index = DOC_PAGES.findIndex((p) => p.slug === slug);
  const prev = index > 0 ? DOC_PAGES[index - 1] : null;
  const next = index >= 0 && index < DOC_PAGES.length - 1 ? DOC_PAGES[index + 1] : null;

  const haystack = useMemo(() => new Map(DOC_PAGES.map((p) => [p.slug, pageText(p)])), []);
  const q = query.trim().toLowerCase();
  const groups = DOC_GROUPS.map((g) => ({ ...g, pages: q ? g.pages.filter((p) => haystack.get(p.slug)!.includes(q)) : g.pages })).filter(
    (g) => g.pages.length,
  );
  const toc = page ? page.blocks.flatMap((b) => (b.type === "h2" ? [{ id: b.id, text: b.text }] : [])) : [];

  return (
    <DocsBaseContext.Provider value={base}>
    <Shell>
      <div className="flex gap-8">
        {/* Page list */}
        <nav aria-label={t("docs.pages")} className="hidden w-60 shrink-0 lg:block">
          <div className={`sticky ${stick} max-h-[calc(100vh-7rem)] space-y-5 overflow-y-auto pb-8 pr-2`}>
            <div className="flex items-center gap-2 text-sm font-bold text-[#0B1F33]">
              <BookOpen className="h-4 w-4 text-[#0E7490]" aria-hidden="true" />
              {t("docs.title")}
            </div>
            <label className="relative block">
              <span className="sr-only">{t("docs.search")}</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("docs.search")}
                className="w-full rounded-xl border border-[#D8E2EA] bg-white py-2 pl-9 pr-3 text-sm focus:border-[#0E7490] focus:outline-none"
              />
            </label>
            {groups.length === 0 && <p className="text-xs text-[#64748B]">{t("docs.noResults")}</p>}
            {groups.map((g) => (
              <div key={g.title} className="space-y-1">
                <p className="px-2 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">{g.title}</p>
                {g.pages.map((p) => (
                  <Link
                    key={p.slug}
                    href={href(p.slug)}
                    aria-current={p.slug === slug ? "page" : undefined}
                    className={`block rounded-lg px-2 py-1.5 text-sm ${
                      p.slug === slug ? "bg-[#0B1F33] font-medium text-white" : "text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0B1F33]"
                    }`}
                  >
                    {p.title}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </nav>

        {/* Page */}
        <article className="min-w-0 flex-1 pb-16">
          {/* Small screens: page picker instead of the side list */}
          <label className="mb-6 block lg:hidden">
            <span className="mb-1 block text-xs font-semibold text-[#64748B]">{t("docs.pages")}</span>
            <select
              value={slug}
              onChange={(e) => router.push(href(e.target.value))}
              className="w-full rounded-xl border border-[#D8E2EA] bg-white p-2 text-sm"
            >
              {DOC_GROUPS.map((g) => (
                <optgroup key={g.title} label={g.title}>
                  {g.pages.map((p) => (
                    <option key={p.slug} value={p.slug}>{p.title}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>

          {!page ? (
            <p className="text-sm text-[#475569]">{t("docs.notFound")}</p>
          ) : (
            <div className="mx-auto max-w-3xl space-y-6">
              <header className="space-y-2 border-b border-[#D8E2EA] pb-6">
                {page.audience && (
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#0E7490]">{page.audience}</p>
                )}
                <h1 className="text-2xl font-extrabold text-[#0B1F33] sm:text-3xl">{page.title}</h1>
                <p className="text-sm leading-7 text-[#475569] sm:text-base">{page.summary}</p>
              </header>
              <DocBlocks blocks={page.blocks} />
              <div className="grid grid-cols-1 gap-3 border-t border-[#D8E2EA] pt-6 sm:grid-cols-2">
                {prev ? (
                  <Link href={href(prev.slug)} className="rounded-xl border border-[#D8E2EA] bg-white p-4 hover:border-[#0E7490]">
                    <span className="flex items-center gap-1 text-xs text-[#64748B]">
                      <ArrowLeft className="h-3 w-3" aria-hidden="true" /> {t("docs.previous")}
                    </span>
                    <span className="text-sm font-semibold text-[#0B1F33]">{prev.title}</span>
                  </Link>
                ) : (
                  <span />
                )}
                {next && (
                  <Link href={href(next.slug)} className="rounded-xl border border-[#D8E2EA] bg-white p-4 text-right hover:border-[#0E7490]">
                    <span className="flex items-center justify-end gap-1 text-xs text-[#64748B]">
                      {t("docs.next")} <ArrowRight className="h-3 w-3" aria-hidden="true" />
                    </span>
                    <span className="text-sm font-semibold text-[#0B1F33]">{next.title}</span>
                  </Link>
                )}
              </div>
            </div>
          )}
        </article>

        {/* On this page */}
        {toc.length > 0 && (
          <aside aria-label={t("docs.onThisPage")} className="hidden w-52 shrink-0 xl:block">
            <div className={`sticky ${stick} space-y-2`}>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">{t("docs.onThisPage")}</p>
              {toc.map((h) => (
                <a key={h.id} href={`#${h.id}`} className="block text-sm leading-6 text-[#475569] hover:text-[#0E7490]">
                  {h.text}
                </a>
              ))}
            </div>
          </aside>
        )}
      </div>
    </Shell>
    </DocsBaseContext.Provider>
  );
}
