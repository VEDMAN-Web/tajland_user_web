"use client";

import Image from "next/image";
import { Suspense } from "react";
import { ResetPasswordForm } from "./ResetPasswordForm";

export function ResetPasswordPage() {
  return (
    <section className="flex flex-1 items-center bg-white px-4 py-8 sm:px-8 lg:px-12 lg:py-10">
      <div className="mx-auto grid w-full max-w-[1080px] items-stretch gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
        <div className="relative min-h-[420px] overflow-hidden rounded-[28px] bg-[#0b1f4d] text-white sm:min-h-[560px] lg:min-h-[680px]">
          <Image
            src="/images/auth/img_reset-pass.png"
            alt=""
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 540px"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent" />
          <div className="relative z-10 px-7 py-8 [text-shadow:0_1px_10px_rgba(0,0,0,0.35)] sm:px-8 sm:py-9">
            <h1 className="text-[26px] font-semibold leading-[1.15] tracking-[-0.03em] text-white sm:text-[30px]">
              <span className="block">Secure your digital</span>
              <span className="block">journey.</span>
            </h1>
            <p className="mt-3 text-[13px] font-normal leading-5 text-white sm:text-[14px]">
              Explore. Choose. Claim. Make a memory yours.
            </p>
          </div>
        </div>

        <Suspense fallback={<div className="flex flex-col px-4 py-12 sm:px-12 lg:px-[74px] lg:py-16"><div className="w-full max-w-[365px] lg:mx-auto animate-pulse">Loading...</div></div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </section>
  );
}
