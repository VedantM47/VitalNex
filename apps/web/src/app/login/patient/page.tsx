"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "../../../lib/i18n";

export default function PatientLoginRedirect() {
  const router = useRouter();
  const { t } = useTranslation();
  useEffect(() => {
    router.replace("/auth/login?role=patient");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7FAFC] text-[#64748B] text-xs font-semibold">
      {t("auth.redirecting")}
    </div>
  );
}
