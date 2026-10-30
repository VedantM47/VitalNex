"use client";

import React from "react";
import Link from "next/link";
import { AlertTriangle, Info, Lightbulb, ShieldAlert, Scale } from "lucide-react";
import type { CalloutKind, DocBlock } from "../../content/docs/types";
import { NITI_PRINCIPLES } from "../../content/docs/niti";
import { docsHref, useDocsBase } from "./docs-base";

/** Renders **bold**, `code` and [label](href) inside a text. Everything else is plain text. */
export function Inline({ text }: { text: string }) {
  const base = useDocsBase();
  const parts: React.ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const key = m.index;
    if (m[1]) parts.push(<strong key={key} className="font-semibold text-[#0B1F33]">{m[1]}</strong>);
    else if (m[2])
      parts.push(
        <code key={key} className="rounded-md bg-[#F1F5F9] px-1.5 py-0.5 font-mono text-[0.85em] text-[#0B1F33]">
          {m[2]}
        </code>,
      );
    else if (m[3] && m[4]) {
      const cls = "font-medium text-[#0E7490] underline underline-offset-2 hover:text-[#0B1F33]";
      parts.push(
        m[4].startsWith("/") ? (
          <Link key={key} href={docsHref(base, m[4])} className={cls}>{m[3]}</Link>
        ) : m[4].startsWith("#") ? (
          <a key={key} href={m[4]} className={cls}>{m[3]}</a>
        ) : (
          <a key={key} href={m[4]} className={cls} target="_blank" rel="noreferrer">{m[3]}</a>
        ),
      );
    }
    last = re.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

const CALLOUT: Record<CalloutKind, { cls: string; icon: React.ElementType; label: string }> = {
  info: { cls: "border-[#BAE6FD] bg-[#F0F9FF] text-[#0C4A6E]", icon: Info, label: "Note" },
  tip: { cls: "border-[#BBF7D0] bg-[#F0FDF4] text-[#14532D]", icon: Lightbulb, label: "Tip" },
  warning: { cls: "border-[#FDE68A] bg-[#FFFBEB] text-[#78350F]", icon: AlertTriangle, label: "Important" },
  danger: { cls: "border-[#FECACA] bg-[#FEF2F2] text-[#7F1D1D]", icon: ShieldAlert, label: "Safety" },
};

function Block({ b }: { b: DocBlock }) {
  switch (b.type) {
    case "h2":
      return (
        <h2 id={b.id} className="scroll-mt-24 border-b border-[#E2E8F0] pb-2 pt-6 text-xl font-bold text-[#0B1F33] sm:text-2xl">
          {b.text}
        </h2>
      );
    case "h3":
      return <h3 className="pt-2 text-base font-semibold text-[#0B1F33] sm:text-lg">{b.text}</h3>;
    case "p":
      return (
        <p className="text-sm leading-7 text-[#334155] sm:text-[15px]">
          <Inline text={b.text} />
        </p>
      );
    case "list": {
      const Tag = b.ordered ? "ol" : "ul";
      return (
        <Tag className={`space-y-1.5 pl-5 text-sm leading-7 text-[#334155] sm:text-[15px] ${b.ordered ? "list-decimal" : "list-disc"}`}>
          {b.items.map((it, i) => (
            <li key={i}><Inline text={it} /></li>
          ))}
        </Tag>
      );
    }
    case "steps":
      return (
        <ol className="space-y-4">
          {b.items.map((s, i) => (
            <li key={i} className="flex gap-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0B1F33] text-xs font-bold text-white">
                {i + 1}
              </span>
              <div className="space-y-1 pt-0.5">
                <p className="text-sm font-semibold text-[#0B1F33] sm:text-[15px]"><Inline text={s.title} /></p>
                <p className="text-sm leading-7 text-[#334155]"><Inline text={s.text} /></p>
              </div>
            </li>
          ))}
        </ol>
      );
    case "callout": {
      const c = CALLOUT[b.kind];
      const Icon = c.icon;
      return (
        <div className={`flex gap-3 rounded-xl border p-4 text-sm leading-6 ${c.cls}`}>
          <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">{b.title ?? c.label}</p>
            <p><Inline text={b.text} /></p>
          </div>
        </div>
      );
    }
    case "image":
      return (
        <figure className="space-y-3">
          <div className="overflow-hidden rounded-xl border border-[#D8E2EA] bg-white shadow-[0_1px_3px_rgba(11,31,51,0.06)]">
            {/* eslint-disable-next-line @next/next/no-img-element -- static local screenshot, sizes vary */}
            <img src={b.src} alt={b.alt} className="block h-auto w-full" loading="lazy" />
          </div>
          {(b.caption || b.markers) && (
            <figcaption className="space-y-2">
              {b.caption && <p className="text-xs text-[#64748B] sm:text-sm"><Inline text={b.caption} /></p>}
              {b.markers && (
                <ol className="space-y-1.5">
                  {b.markers.map((mk) => (
                    <li key={mk.n} className="flex gap-2.5 text-sm leading-6 text-[#334155]">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#E11D48] text-[11px] font-bold text-white">
                        {mk.n}
                      </span>
                      <span><Inline text={mk.text} /></span>
                    </li>
                  ))}
                </ol>
              )}
            </figcaption>
          )}
        </figure>
      );
    case "niti":
      return (
        <div className="space-y-3">
          {b.items.map((it) => {
            const p = NITI_PRINCIPLES[it.id];
            return (
              <div key={it.id} className="rounded-xl border border-[#D8E2EA] bg-white p-4 sm:p-5">
                <div className="flex items-center gap-2">
                  <Scale className="h-4 w-4 text-[#0E7490]" aria-hidden="true" />
                  <p className="text-sm font-bold text-[#0B1F33] sm:text-[15px]">{p.name}</p>
                </div>
                <p className="mt-2 rounded-lg bg-[#F8FAFC] p-3 text-sm leading-6 text-[#475569]">
                  <span className="font-semibold text-[#0B1F33]">The rule: </span>
                  {p.rule}
                </p>
                <p className="mt-3 text-sm font-semibold text-[#0B1F33]">How this feature follows it:</p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm leading-6 text-[#334155]">
                  {it.how.map((h, i) => (
                    <li key={i}><Inline text={h} /></li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      );
    case "code":
      return (
        <pre className="overflow-x-auto rounded-xl bg-[#0B1F33] p-4 text-xs leading-6 text-[#E2E8F0] sm:text-sm">
          <code>{b.code}</code>
        </pre>
      );
    case "table":
      return (
        <div className="overflow-x-auto rounded-xl border border-[#D8E2EA]">
          <table className="w-full text-sm">
            <thead className="bg-[#F8FAFC]">
              <tr>
                {b.head.map((h, i) => (
                  <th key={i} scope="col" className="p-3 text-left text-xs font-semibold text-[#334155]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] bg-white">
              {b.rows.map((r, i) => (
                <tr key={i}>
                  {r.map((c, j) => (
                    <td key={j} className="p-3 align-top leading-6 text-[#334155]"><Inline text={c} /></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "faq":
      return (
        <div className="divide-y divide-[#E2E8F0] rounded-xl border border-[#D8E2EA] bg-white">
          {b.items.map((f, i) => (
            <details key={i} className="group p-4">
              <summary className="cursor-pointer list-none text-sm font-semibold text-[#0B1F33] marker:hidden">
                <span className="mr-2 text-[#0E7490] group-open:hidden">+</span>
                <span className="mr-2 hidden text-[#0E7490] group-open:inline">−</span>
                <Inline text={f.q} />
              </summary>
              <p className="mt-2 pl-5 text-sm leading-6 text-[#334155]"><Inline text={f.a} /></p>
            </details>
          ))}
        </div>
      );
  }
}

export function DocBlocks({ blocks }: { blocks: DocBlock[] }) {
  return (
    <div className="space-y-5">
      {blocks.map((b, i) => (
        <Block key={i} b={b} />
      ))}
    </div>
  );
}
