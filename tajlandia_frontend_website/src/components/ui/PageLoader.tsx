import Image from "next/image";
import { brand } from "@/lib/constants/brand";

type PageLoaderProps = {
  /** Already translated, e.g. `t("Loading cart...")`; the trailing dots are animated. */
  label: string;
};

// Full-screen loader for signed-in pages: the logo floating on a card, an
// indeterminate bar and the label. Animations live in `globals.css`.
export function PageLoader({ label }: PageLoaderProps) {
  const text = label.replace(/(\.{3}|…)$/, "");

  return (
    <main
      role="status"
      aria-live="polite"
      aria-label={label}
      className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden bg-[#f7f9fc] px-6"
    >
      <span
        aria-hidden
        className="page-loader-glow pointer-events-none absolute inset-0 m-auto size-[420px] rounded-full bg-[radial-gradient(circle,rgba(11,31,77,0.10)_0%,rgba(224,12,27,0.05)_45%,transparent_70%)]"
      />

      <div aria-hidden className="relative flex flex-col items-center">
        <div className="page-loader-float relative flex h-[104px] w-[240px] items-center justify-center rounded-[28px] border border-white bg-white shadow-[0_24px_60px_-24px_rgba(11,31,77,0.45)]">
          <span className="page-loader-ring absolute inset-0 rounded-[28px] border border-navy/20" />
          <span className="page-loader-ring absolute inset-0 rounded-[28px] border border-navy/20 [animation-delay:1.1s]" />
          <Image
            src={brand.logo.src}
            alt=""
            width={brand.logo.width}
            height={brand.logo.height}
            priority
            className="h-[88px] w-auto object-contain"
          />
        </div>
        <span className="page-loader-shadow mt-5 h-2.5 w-36 rounded-full bg-navy/15 blur-[6px]" />
      </div>

      <div aria-hidden className="mt-7 h-1 w-44 overflow-hidden rounded-full bg-navy/10">
        <span className="page-loader-bar block h-full w-2/5 rounded-full bg-gradient-to-r from-navy via-navy to-[#E00C1B]" />
      </div>

      <p aria-hidden className="mt-4 flex items-end text-sm font-medium tracking-wide text-navy/75">
        {text}
        <span className="ml-0.5 inline-flex gap-[3px] pb-[5px]">
          <span className="page-loader-dot size-1 rounded-full bg-current" />
          <span className="page-loader-dot size-1 rounded-full bg-current [animation-delay:0.15s]" />
          <span className="page-loader-dot size-1 rounded-full bg-current [animation-delay:0.3s]" />
        </span>
      </p>
    </main>
  );
}
