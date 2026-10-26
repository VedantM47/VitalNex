"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  UserCheck,
  Activity,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  Save,
  X,
} from "lucide-react";
import { AppShell } from "../../../components/layout/AppShell";
import { Card, CardHeader } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { RiskBadge, StatusBadge, DemoBadge } from "../../../components/ui/StatusBadge";
import { api } from "../../../lib/api-client";
import { useTranslation } from "../../../lib/i18n";

export default function DoctorPatientsPage() {
  const { t } = useTranslation();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<any | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [updating, setUpdating] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const data = await api.getDoctorReviews("doc-pune-001");
      if (Array.isArray(data)) {
        setReviews(data);
      }
    } catch (err) {
      console.warn("Could not fetch reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    api.getDoctorReviews("doc-pune-001")
      .then((data) => {
        if (active && Array.isArray(data)) {
          setReviews(data);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch reviews:", err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleOpenReview = (rev: any) => {
    setSelectedReview(rev);
    setReviewNotes(rev.review_notes || "");
  };

  const handleSubmitReview = async (newStatus: "in_review" | "reviewed") => {
    if (!selectedReview) return;
    setUpdating(true);
    try {
      const updated = await api.updateDoctorReview(selectedReview.assessment_id, {
        review_status: newStatus,
        clinician_id: "doc-pune-001",
        review_notes: reviewNotes,
      });
      setSelectedReview(null);
      await fetchReviews();
    } catch (e) {
      console.error("Failed to update review:", e);
    } finally {
      setUpdating(false);
    }
  };

  const filteredReviews = reviews.filter((r) => {
    if (statusFilter === "all") return true;
    return r.review_status.toLowerCase() === statusFilter.toLowerCase();
  });

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D8E2EA] pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F33]">
                Clinician Patient Review Queue
              </h1>
              <DemoBadge label="Human-in-the-Loop Oversight" />
            </div>
            <p className="text-xs sm:text-sm text-[#475569]">
              Review flagged screening results and record your decision.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={fetchReviews} isLoading={loading}>
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 p-1.5 bg-[#F1F5F9] rounded-2xl w-fit text-xs font-semibold">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`px-4 py-2 rounded-xl transition-all ${
              statusFilter === "all" ? "bg-white text-[#0B1F33] shadow-xs" : "text-[#64748B] hover:text-[#0B1F33]"
            }`}
          >
            All Reviews ({reviews.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("pending")}
            className={`px-4 py-2 rounded-xl transition-all ${
              statusFilter === "pending" ? "bg-white text-[#0B1F33] shadow-xs" : "text-[#64748B] hover:text-[#0B1F33]"
            }`}
          >
            Pending Review
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("in_review")}
            className={`px-4 py-2 rounded-xl transition-all ${
              statusFilter === "in_review" ? "bg-white text-[#0B1F33] shadow-xs" : "text-[#64748B] hover:text-[#0B1F33]"
            }`}
          >
            In Review
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("reviewed")}
            className={`px-4 py-2 rounded-xl transition-all ${
              statusFilter === "reviewed" ? "bg-white text-[#0B1F33] shadow-xs" : "text-[#64748B] hover:text-[#0B1F33]"
            }`}
          >
            Completed / Reviewed
          </button>
        </div>

        {/* Review Dossiers List */}
        <div className="space-y-4">
          {loading ? (
            <div className="p-12 text-center text-xs text-[#64748B]">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0E7490]" />
              Loading clinician review queue...
            </div>
          ) : filteredReviews.length === 0 ? (
            <Card className="p-12 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-[#0F766E] mx-auto" />
              <h3 className="font-bold text-sm text-[#0B1F33]">Review Queue Clear</h3>
              <p className="text-xs text-[#64748B]">No patient assessments matching the &quot;{statusFilter}&quot; filter require review.</p>
            </Card>
          ) : (
            filteredReviews.map((rev) => {
              const evalDate = new Date(rev.evaluated_at).toLocaleDateString("en-IN", {
                year: "numeric",
                month: "short",
                day: "numeric",
              });

              return (
                <Card key={rev.id} className="p-6 space-y-4 border-[#D8E2EA]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F1F5F9] pb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#0B1F33] text-white flex items-center justify-center font-bold text-sm shrink-0">
                        <Activity className="w-5 h-5 text-[#22C1DC]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-base text-[#0B1F33]">{rev.patient_name}</h3>
                          <span className="text-xs text-[#64748B]">({rev.patient_id})</span>
                        </div>
                        <p className="text-xs text-[#0E7490]">Screened on {evalDate} • Assessment ID: {rev.assessment_id}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <RiskBadge band={rev.risk_band} />
                      <StatusBadge
                        label={rev.review_status === "reviewed" ? "REVIEWED" : rev.review_status === "in_review" ? "IN REVIEW" : "PENDING"}
                        variant={rev.review_status === "reviewed" ? "success" : rev.review_status === "in_review" ? "info" : "warning"}
                        size="sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                      <span className="text-[#64748B] block">Risk Score / Band:</span>
                      <span className="font-bold text-[#0B1F33]">{rev.risk_score}% ({rev.risk_band})</span>
                    </div>
                    <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                      <span className="text-[#64748B] block">Model Architecture:</span>
                      <span className="font-semibold text-[#475569]">{rev.model_version}</span>
                    </div>
                    <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                      <span className="text-[#64748B] block">Data Quality Score:</span>
                      <span className="font-bold text-[#0F766E]">{rev.data_quality_score}/100</span>
                    </div>
                  </div>

                  <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-1 text-xs">
                    <span className="font-semibold text-[#0B1F33]">Explainability Summary:</span>
                    <p className="text-[#475569]">{rev.explainability_summary}</p>
                  </div>

                  {rev.review_notes && (
                    <div className="p-3 bg-[#F0FDF4] rounded-xl border border-[#0F766E]/20 space-y-1 text-xs">
                      <span className="font-bold text-[#0F766E]">Clinician Review Note:</span>
                      <p className="text-[#0F766E]">{rev.review_notes}</p>
                    </div>
                  )}

                  <div className="pt-3 border-t border-[#F1F5F9] flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <a
                        href={api.getReportPdfUrl(rev.assessment_id)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#0E7490] hover:underline font-semibold flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Inspect Full Clinical Report (PDF)</span>
                      </a>
                      <Link
                        href={`/ai-trust?id=${rev.assessment_id}`}
                        className="text-[#0B1F33] hover:underline font-semibold flex items-center gap-1"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-[#0F766E]" />
                        <span>AI Trust Passport</span>
                      </Link>
                    </div>

                    <Button size="sm" variant="primary" onClick={() => handleOpenReview(rev)}>
                      {rev.review_status === "reviewed" ? "Edit Review" : "Open Review & Sign-off"}
                    </Button>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* Clinician Review Sign-off Modal */}
        {selectedReview && (
          <div className="fixed inset-0 z-50 bg-[#0B1F33]/50 backdrop-blur-xs flex items-center justify-center p-4">
            <Card className="max-w-lg w-full p-6 space-y-5 bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
                <div className="space-y-0.5">
                  <h3 className="font-bold text-sm text-[#0B1F33]">
                    Clinician Review: {selectedReview.patient_name}
                  </h3>
                  <span className="text-xs text-[#64748B]">Assessment: {selectedReview.assessment_id}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedReview(null)}
                  className="p-1 text-[#64748B] hover:text-[#0B1F33]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-1">
                  <span className="font-bold text-[#0B1F33]">Model Risk Assessment:</span>
                  <p className="text-[#475569]">
                    Score: <strong>{selectedReview.risk_score}%</strong> ({selectedReview.risk_band} Risk)
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-[#0B1F33] block">
                    Clinical Review & Management Notes:
                  </label>
                  <textarea
                    rows={4}
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Enter clinical assessment evaluation, lifestyle notes, or follow-up recommendations..."
                    className="w-full p-3 bg-white border border-[#CBD5E1] rounded-xl text-xs text-[#0B1F33] focus:outline-none focus:ring-2 focus:ring-[#0E7490]"
                  />
                </div>

                <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-[#F1F5F9]">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedReview(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    isLoading={updating}
                    onClick={() => handleSubmitReview("in_review")}
                  >
                    Mark In-Review
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    isLoading={updating}
                    onClick={() => handleSubmitReview("reviewed")}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                    Complete & Sign-off
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </AppShell>
  );
}
