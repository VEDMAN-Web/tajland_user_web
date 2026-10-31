"use client";

import Image from "next/image";
import { useState } from "react";
import { ScrollAnimatedElement } from "@/components/animations/ScrollAnimatedElement";

type AuthShellProps = {
  /** Hero photo under `/images/auth`. */
  image: string;
  /** The hero heading's lines (`<span className="block">` each). */
  title: React.ReactNode;
  /** The short line(s) in the pill under the heading. */
  blurb: React.ReactNode;
  children: React.ReactNode;
};

const MOUNTAINS = (
  <>
    <path d="M0 215 L80 150 L140 185 L235 100 L325 195 L415 135 L515 205 L620 120 L715 185 L800 150 V300 H0 Z" fill="currentColor" fillOpacity="0.035" />
    <path d="M0 245 L70 200 L130 228 L210 170 L300 235 L400 190 L500 240 L600 180 L700 232 L800 205 V300 H0 Z" fill="currentColor" fillOpacity="0.045" />
    <path d="M0 262 C110 232 190 282 310 258 S530 228 650 258 S760 250 800 244 V300 H0 Z" fill="currentColor" fillOpacity="0.06" />
    <path d="M0 262 C110 232 190 282 310 258 S530 228 650 258 S760 250 800 244" fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="1.2" />
  </>
);

/**
 * The frame the Login and Sign Up pages use, for the other auth screens (verify code,
 * forgot / reset password): the hero photo on the left (a banner on small screens) and the
 * form card over the soft mountain background on the right.
 */
export function AuthShell({ image, title, blurb, children }: AuthShellProps) {
  // Skeleton until the (large) side photo has loaded.
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <section className="flex min-h-[100svh] flex-1 flex-col overflow-x-clip bg-white lg:grid lg:grid-cols-[1.08fr_1fr]">
      <aside className="relative isolate h-[300px] shrink-0 overflow-hidden bg-[#0b1f4d] text-white sm:h-[360px] lg:sticky lg:top-0 lg:h-[100svh]">
        {!imageLoaded ? (
          <span aria-hidden="true" className="absolute inset-0 animate-pulse bg-[#1a2f63] motion-reduce:animate-none" />
        ) : null}
        <Image
          src={image}
          alt=""
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 55vw"
          onLoad={() => setImageLoaded(true)}
          className={`object-cover object-center transition-opacity duration-700 ${imageLoaded ? "auth-hero-zoom opacity-100" : "opacity-0"}`}
        />
        <div aria-hidden="true" className="absolute inset-0 bg-linear-to-b from-black/30 via-transparent to-[#071536]/85" />
        <div aria-hidden="true" className="absolute inset-0 bg-linear-to-r from-[#071536]/30 to-transparent" />

        <div className="relative z-10 flex h-full flex-col justify-between px-6 pb-12 pt-6 sm:px-10 sm:pt-8 lg:px-14 lg:pb-14 lg:pt-12">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/25 bg-black/25 px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-white/90">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ff4b5c]" />
            Tajlandia
          </span>

          <div>
            <h1 className="text-[30px] font-semibold leading-[1.08] tracking-[-0.035em] text-white [text-shadow:0_2px_20px_rgba(0,0,0,0.35)] sm:text-[40px] lg:text-[54px]">
              {title}
            </h1>
            <p className="mt-4 max-w-[34rem] rounded-[20px] border border-white/25 bg-black/25 px-4 py-3 text-[12px] leading-[1.55] text-white/95 sm:text-[14px]">
              {blurb}
            </p>
          </div>
        </div>
      </aside>

      <div className="relative z-10 -mt-8 flex flex-1 items-center justify-center rounded-t-[32px] bg-white px-5 pb-10 pt-8 sm:px-10 lg:mt-0 lg:rounded-none lg:bg-[#f6f8fc] lg:px-12 lg:py-4">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden overflow-hidden lg:block">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#e11d2e]/[0.05] blur-3xl" />
          <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-navy/[0.07] blur-3xl" />
          <svg viewBox="0 0 800 300" preserveAspectRatio="xMidYMax slice" className="absolute inset-x-0 bottom-0 h-[42%] w-full text-navy">
            {MOUNTAINS}
          </svg>
          <svg viewBox="0 0 800 300" preserveAspectRatio="xMidYMax slice" className="absolute inset-x-0 top-0 h-[42%] w-full rotate-180 text-navy">
            {MOUNTAINS}
          </svg>
        </div>

        <ScrollAnimatedElement animation="slide-in-right" duration={600} className="relative mx-auto w-full max-w-[440px]">
          <div className="rounded-[28px] bg-white lg:p-7 lg:shadow-[0_24px_60px_-24px_rgba(11,31,77,0.22)] lg:ring-1 lg:ring-[#e6eaf3]">
            {children}
          </div>
        </ScrollAnimatedElement>
      </div>
    </section>
  );
}
