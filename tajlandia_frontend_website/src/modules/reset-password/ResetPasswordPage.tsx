"use client";

import { Suspense } from "react";
import { ResetPasswordForm } from "./ResetPasswordForm";

export function ResetPasswordPage() {
  return (
    <section className="flex flex-1 items-center bg-white px-4 py-8 sm:px-8 lg:px-10 lg:py-10">
      <div className="mx-auto grid w-full max-w-[1030px] overflow-hidden rounded-[1.75rem] bg-white shadow-[0_18px_55px_rgba(11,31,77,0.06)] lg:min-h-[625px] lg:grid-cols-[1.02fr_1fr] lg:shadow-none">
        <div className="relative min-h-[330px] overflow-hidden rounded-[1.75rem] bg-[#071d52] px-8 py-10 text-white sm:px-10 lg:min-h-0 lg:px-9 lg:py-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_12%_72%,rgba(212,232,246,0.95)_0%,rgba(125,177,225,0.8)_18%,transparent_43%),radial-gradient(ellipse_at_88%_76%,rgba(255,146,147,0.95)_0%,rgba(241,105,126,0.7)_18%,transparent_43%),linear-gradient(180deg,#061b4d_0%,#0d397e_36%,#5b95d0_67%,#e9bfd1_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,rgba(255,255,255,0.24),transparent_42%)] opacity-80" />
          <div className="relative z-10 max-w-[300px]">
            <h1 className="text-[25px] leading-[1.18] tracking-[-0.03em] sm:text-[27px]">Secure your digital<br />journey.</h1>
            <p className="mt-3 text-[13px] leading-5 text-white/80">Explore. Choose. Claim. Make a memory yours.</p>
          </div>
        </div>

        <Suspense fallback={<div className="flex flex-col px-4 py-12 sm:px-12 lg:px-[74px] lg:py-16"><div className="w-full max-w-[365px] lg:mx-auto animate-pulse">Loading...</div></div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </section>
  );
}
