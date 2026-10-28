"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "../../../lib/i18n";

export default function DoctorLoginRedirect() {
  const router = useRouter();
  const { t } = useTranslation();
  useEffect(() => {
    router.replace("/auth/login?role=doctor");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7FAFC] text-[#64748B] text-xs font-semibold">
      {t("auth.redirecting")}
    </div>
  );
}
