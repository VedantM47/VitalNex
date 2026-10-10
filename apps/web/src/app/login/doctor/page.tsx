"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DoctorLoginRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/auth/login?role=doctor");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7FAFC] text-[#64748B] text-xs font-semibold">
      Redirecting to Clinician Portal Login...
    </div>
  );
}
