"use client";

import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { ResetPasswordForm } from "./ResetPasswordForm";

export function ResetPasswordPage() {
  return (
    <AuthShell
      image="/images/auth/img_reset-pass.png"
      title={
        <>
          <span className="block">Secure your digital</span>
          <span className="block font-display text-[1.1em] font-medium italic">journey.</span>
        </>
      }
      blurb="Explore. Choose. Claim. Make a memory yours."
    >
      <Suspense fallback={<div className="animate-pulse text-[14px] text-[#64748b]">Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
