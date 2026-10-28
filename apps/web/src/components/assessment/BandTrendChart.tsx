"use client";

import React from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useTranslation } from "../../lib/i18n";
import { DISEASES, bandIndex, type AssessmentRecord, type Disease } from "../../lib/assessment";

// Categorical slots 1-3 of the validated dataviz palette; identity is also carried by the
// marker shape, the legend and the table in the history list (never colour alone).
const SERIES: Record<Disease, { color: string; dash?: string; shape: "circle" | "square" | "diamond" }> = {
  diabetes: { color: "#2a78d6", shape: "circle" },
  heart: { color: "#eb6834", dash: "6 3", shape: "square" },
  stroke: { color: "#1baf7a", dash: "2 3", shape: "diamond" },
};

function Marker({ cx, cy, shape, color }: { cx?: number | null; cy?: number | null; shape: string; color: string }) {
  if (cx == null || cy == null || Number.isNaN(cy)) return null;
  const s = 5;
  if (shape === "square")
    return <rect x={cx - s} y={cy - s} width={s * 2} height={s * 2} fill={color} stroke="#fff" strokeWidth={2} />;
  if (shape === "diamond")
    return (
      <polygon
        points={`${cx},${cy - s - 1} ${cx + s + 1},${cy} ${cx},${cy + s + 1} ${cx - s - 1},${cy}`}
        fill={color}
        stroke="#fff"
        strokeWidth={2}
      />
    );
  return <circle cx={cx} cy={cy} r={s} fill={color} stroke="#fff" strokeWidth={2} />;
}

/** Band over time per condition (1 = Low, 2 = Moderate, 3 = High). Not-confident results leave a gap. */
export function BandTrendChart({ records }: { records: AssessmentRecord[] }) {
  const { t, language } = useTranslation();
  const locale = language === "en" ? "en-IN" : `${language}-IN`;
  const data = [...records]
    .filter((r) => !r.emergency_flag && r.results && Object.keys(r.results).length > 0)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map((r) => {
      const row: Record<string, string | number | null> = {
        date: new Date(r.created_at).toLocaleDateString(locale, { day: "numeric", month: "short", year: "2-digit" }),
      };
      for (const d of DISEASES) {
        const res = r.results[d];
        row[d] = res && !res.abstained ? bandIndex(res.band) : null;
      }
      return row;
    });

  if (data.length === 0) return <p className="text-sm text-[#475569]">{t("historyPage.trendEmpty")}</p>;

  const bandName = (v: number) => (v === 1 ? t("results.band.low") : v === 2 ? t("results.band.moderate") : v === 3 ? t("results.band.high") : "");

  return (
    <div className="h-72 w-full" role="img" aria-label={t("historyPage.trendAria")}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 16, bottom: 4, left: 8 }}>
          <CartesianGrid stroke="#E2E8F0" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#475569" }} tickLine={false} axisLine={{ stroke: "#CBD5E1" }} />
          <YAxis
            domain={[0.5, 3.5]}
            ticks={[1, 2, 3]}
            tickFormatter={bandName}
            tick={{ fontSize: 11, fill: "#475569" }}
            tickLine={false}
            axisLine={false}
            width={90}
          />
          <Tooltip
            formatter={(value, name) => [typeof value === "number" ? bandName(value) : t("results.notConfident"), t(`results.condition.${String(name)}`)]}
            contentStyle={{ borderRadius: 12, borderColor: "#D8E2EA", fontSize: 12 }}
          />
          <Legend formatter={(value) => <span className="text-xs text-[#0F172A]">{t(`results.condition.${String(value)}`)}</span>} />
          {DISEASES.map((d) => (
            <Line
              key={d}
              type="stepAfter"
              dataKey={d}
              name={d}
              stroke={SERIES[d].color}
              strokeWidth={2}
              strokeDasharray={SERIES[d].dash}
              connectNulls={false}
              isAnimationActive={false}
              dot={(p: { cx?: number | null; cy?: number | null; index?: number }) => (
                <Marker key={`${d}-${p.index}`} cx={p.cx} cy={p.cy} shape={SERIES[d].shape} color={SERIES[d].color} />
              )}
              activeDot={{ r: 7 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
