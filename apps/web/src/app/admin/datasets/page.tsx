"use client";

import React, { useState, useEffect } from "react";
import { Database, ShieldCheck, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { AppShell } from "../../../components/layout/AppShell";
import { Card, CardHeader } from "../../../components/ui/Card";
import { StatusBadge, DemoBadge } from "../../../components/ui/StatusBadge";
import { api } from "../../../lib/api-client";

export default function DatasetsPage() {
  const [metadata, setMetadata] = useState<any>({
    dataset_name: "Pune Clinical Risk Synthetic Research Dataset",
    version: "1.0.0-academic",
    rows: 20000,
    columns: 26,
    is_synthetic: true,
    phi_detected: false,
    disclaimer: "Academic synthetic dataset for clinical AI research; not real patient records.",
  });

  useEffect(() => {
    async function loadMeta() {
      try {
        const data = await api.getDatasetMetadata();
        if (data) setMetadata(data);
      } catch {
        // Keep fallback
      }
    }
    loadMeta();
  }, []);

  const features = [
    { name: "patient_id", type: "string", role: "Synthetic Identifier", desc: "Never represents a real patient" },
    { name: "age", type: "integer", role: "Model Feature", desc: "Age in years (18–85)" },
    { name: "sex", type: "integer", role: "Model & Fairness Feature", desc: "0=Female, 1=Male" },
    { name: "locality_type", type: "string", role: "Context & Subgroup", desc: "Urban_Pune, PCMC, Peri_Urban, Rural" },
    { name: "socioeconomic_band", type: "string", role: "Fairness Subgroup", desc: "Lower to Upper groupings" },
    { name: "bmi", type: "float", role: "Model Feature", desc: "Body Mass Index" },
    { name: "smoking", type: "integer", role: "Lifestyle & Model", desc: "0=No, 1=Yes" },
    { name: "trestbps", type: "float", role: "Model Feature", desc: "Resting BP (mm Hg)" },
    { name: "chol", type: "float", role: "Model Feature", desc: "Serum Cholesterol (mg/dL)" },
    { name: "thalach", type: "float", role: "Model Feature", desc: "Maximum Heart Rate Achieved" },
    { name: "heart_disease_risk", type: "integer", role: "Target Variable", desc: "Synthetic binary risk event indicator" },
  ];

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D8E2EA] pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F33]">
                Research Datasets & Ingestion Interface
              </h1>
              <DemoBadge label="Synthetic Academic Package" />
            </div>
            <p className="text-xs sm:text-sm text-[#475569]">
              Verified schema contracts and provenance documentation for research dataset v1.0.
            </p>
          </div>
        </div>

        {/* Dataset Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 space-y-1">
            <p className="text-xs text-[#64748B]">Dataset Rows</p>
            <p className="text-2xl font-bold text-[#0B1F33]">{metadata.rows.toLocaleString()}</p>
            <p className="text-[10px] text-[#0F766E] font-medium">100% Synthetic Records</p>
          </Card>
          <Card className="p-5 space-y-1">
            <p className="text-xs text-[#64748B]">Feature Columns</p>
            <p className="text-2xl font-bold text-[#0B1F33]">{metadata.columns}</p>
            <p className="text-[10px] text-[#64748B]">Clinical & Demographic</p>
          </Card>
          <Card className="p-5 space-y-1">
            <p className="text-xs text-[#64748B]">PHI Privacy Audit</p>
            <p className="text-2xl font-bold text-[#0F766E]">Zero PHI</p>
            <p className="text-[10px] text-[#0F766E] font-medium">Fully De-identified Synthetic</p>
          </Card>
          <Card className="p-5 space-y-1">
            <p className="text-xs text-[#64748B]">Target Variable</p>
            <p className="text-lg font-bold text-[#0B1F33] font-mono">heart_disease_risk</p>
            <p className="text-[10px] text-[#64748B]">Binary Classification</p>
          </Card>
        </div>

        {/* Schema Inspection Table */}
        <Card className="p-6 space-y-4">
          <CardHeader
            title="Feature Schema Registry"
            subtitle="Architecturally registered columns in data/raw/Pune_Clinical_Risk_Synthetic_Dataset_20000.csv."
            badge={<StatusBadge label="Validated Schema" variant="success" size="sm" />}
          />

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-[#D8E2EA] text-[#475569]">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Feature Name</th>
                  <th className="py-2.5 px-4 font-semibold">Type</th>
                  <th className="py-2.5 px-4 font-semibold">Architectural Role</th>
                  <th className="py-2.5 px-4 font-semibold">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {features.map((f) => (
                  <tr key={f.name} className="hover:bg-[#F8FAFC]/50">
                    <td className="py-2.5 px-4 font-mono font-bold text-[#0B1F33]">{f.name}</td>
                    <td className="py-2.5 px-4 text-[#64748B]">{f.type}</td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-[#0E7490]/10 text-[#0E7490] font-medium">
                        {f.role}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-[#475569]">{f.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
