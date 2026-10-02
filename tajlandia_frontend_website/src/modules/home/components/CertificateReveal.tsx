"use client";

import { useInViewReplay } from "@/lib/hooks/useInViewReplay";
import { cn } from "@/lib/utils/cn";

type CertificateRevealProps = {
  children: React.ReactNode;
  className?: string;
};

/**
 * Red stamp-style seal: "VERIFIED" along the top arc, "TAJLANDIA" along the
 * bottom arc (reading left to right, not upside down), dots at the sides and a
 * check mark in the middle.
 */
function VerifiedSeal() {
  return (
    <svg viewBox="0 0 120 120" className="h-full w-full drop-shadow-[0_6px_14px_rgba(200,30,30,0.35)]">
      <defs>
        {/* Top arc runs over the top; its letters sit outside the baseline (r=38 → ~46). */}
        <path id="cert-seal-top" d="M22 60 A38 38 0 0 1 98 60" />
        {/* Bottom arc runs under the bottom left→right; its letters grow inward (r=45 → ~37). */}
        <path id="cert-seal-bottom" d="M15 60 A45 45 0 0 0 105 60" />
      </defs>
      <circle cx="60" cy="60" r="57" fill="#c81e1e" />
      <circle cx="60" cy="60" r="51" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="1.5" />
      <circle cx="60" cy="60" r="31" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="1.5" />
      <g fill="#fff" fontSize="10" fontWeight="700" letterSpacing="2" textAnchor="middle">
        <text>
          <textPath href="#cert-seal-top" startOffset="50%">
            VERIFIED
          </textPath>
        </text>
        <text>
          <textPath href="#cert-seal-bottom" startOffset="50%">
            TAJLANDIA
          </textPath>
        </text>
      </g>
      <circle cx="19" cy="60" r="2.2" fill="#fff" />
      <circle cx="101" cy="60" r="2.2" fill="#fff" />
      <path d="M47 61 l9 9 l17 -19" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * "Issued" entrance for the certificate: it prints in from the top, a VERIFIED
 * seal stamps onto it (with a small impact shake and ring), then a sheen sweeps
 * across. Replays each time it scrolls back into view.
 */
export function CertificateReveal({ children, className }: CertificateRevealProps) {
  const { ref, inView } = useInViewReplay<HTMLElement>(0.35);

  return (
    <figure ref={ref} className={cn("relative", inView && "cert-shake", className)}>
      <div className={cn("relative", inView ? "cert-print" : "cert-unprinted")}>
        {children}
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <span className={cn("cert-sheen-bar", inView && "cert-sheen")} />
        </span>
      </div>
      <span
        aria-hidden="true"
        // Sits on the certificate's right border, in the empty band beside the details card.
        className="pointer-events-none absolute right-0 top-[47%] h-16 w-16 translate-x-1/3 -translate-y-1/2 sm:h-20 sm:w-20"
      >
        <span className={cn("absolute inset-0 rounded-full border-2 border-brand-red", inView ? "cert-seal-ring" : "opacity-0")} />
        <span className={cn("absolute inset-0 block", inView ? "cert-stamp" : "opacity-0")}>
          <VerifiedSeal />
        </span>
      </span>
    </figure>
  );
}
