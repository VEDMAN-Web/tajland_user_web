"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { useMinimumRai } from "@/lib/cart/cart-snapshot";
import { routes } from "@/lib/constants/routes";
import { useAuth } from "@/lib/hooks/useAuth";
import { fill } from "./CartSummaryCard";
import { useDashboardLanguage } from "./DashboardLanguageContext";
import { startTutorial } from "./tutorial/tutorial-store";

type Translate = (source: string) => string;

const SEEN_KEY_PREFIX = "tajlandia_onboarding_seen_";
const SEEN_CHANGED_EVENT = "tajlandia:onboarding-seen-changed";
const OPEN_EVENT = "tajlandia:onboarding-open";
// The guided tutorial a new user gets on their first sign-in (see tutorial/tutorials.ts).
const FIRST_LOGIN_TUTORIAL_ID = "buy-plot";
// Storage can be blocked (private windows): "seen" then lasts until reload.
const seenInMemory = new Set<string>();

/** Opens the welcome tour from anywhere in the dashboard (Help & Support's button). */
export function openOnboarding() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

function readSeen(userId: string): boolean {
  if (seenInMemory.has(userId)) return true;
  try {
    return localStorage.getItem(SEEN_KEY_PREFIX + userId) === "1";
  } catch {
    return false;
  }
}

function writeSeen(userId: string) {
  seenInMemory.add(userId);
  try {
    localStorage.setItem(SEEN_KEY_PREFIX + userId, "1");
  } catch {
    // Not saved; it may show again after a reload.
  }
  window.dispatchEvent(new Event(SEEN_CHANGED_EVENT));
}

function subscribeSeen(onChange: () => void) {
  window.addEventListener(SEEN_CHANGED_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(SEEN_CHANGED_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

const iconClass = "h-7 w-7";

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={iconClass}>
      <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3.5 12h17M12 3.5c2.4 2.4 3.6 5.2 3.6 8.5s-1.2 6.1-3.6 8.5c-2.4-2.4-3.6-5.2-3.6-8.5S9.6 5.9 12 3.5Z" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={iconClass}>
      <path d="M9 4.5 3.5 6.5v13L9 17.5l6 2 5.5-2v-13L15 6.5l-6-2ZM9 4.5v13M15 6.5v13" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.6" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={iconClass}>
      <path d="M3 4h2.6l2 10.2a1.5 1.5 0 0 0 1.5 1.2h7.6a1.5 1.5 0 0 0 1.5-1.1L20 8H6.4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
      <circle cx="9.5" cy="19" r="1.4" fill="currentColor" />
      <circle cx="16.5" cy="19" r="1.4" fill="currentColor" />
    </svg>
  );
}

function CertificateIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={iconClass}>
      <path d="M6 3.5h12v12H6z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.6" />
      <path d="M9 7.5h6M9 10.5h6M9.5 15.5 8.5 21l3.5-2 3.5 2-1-5.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" />
    </svg>
  );
}

/** Decorative picture at the top of each step (the words are in the step text). */
function BannerPhoto({ src, className }: { src: string; className?: string }) {
  return <Image src={src} alt="" fill sizes="460px" className={`object-cover ${className ?? ""}`} />;
}

function WelcomeVisual() {
  return (
    <>
      <BannerPhoto src="/images/explore/featured-thailand.jpg" />
      <span className="absolute inset-0 bg-linear-to-t from-[#0b1f4d]/70 via-[#0b1f4d]/10 to-transparent" />
    </>
  );
}

function RegionTile({ src, name, className }: { src: string; name: string; className: string }) {
  return (
    <span className={`absolute overflow-hidden rounded-[14px] border-2 border-white shadow-[0_10px_24px_rgba(11,31,77,0.28)] ${className}`}>
      <BannerPhoto src={src} />
      <span className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/60 to-transparent px-2 pb-1.5 pt-5 text-[11px] font-semibold text-white">
        {name}
      </span>
    </span>
  );
}

function ExploreVisual() {
  return (
    <>
      <span className="absolute inset-0 bg-linear-to-br from-[#dbeafe] via-[#eef4ff] to-[#fde8e8]" />
      <RegionTile src="/images/explore/phuket.jpg" name="Phuket" className="left-[7%] top-[34px] h-[112px] w-[34%] -rotate-6" />
      <RegionTile src="/images/explore/bangkok.jpg" name="Bangkok" className="left-[33%] top-[16px] z-10 h-[132px] w-[34%]" />
      <RegionTile src="/images/explore/pattaya.jpg" name="Pattaya" className="right-[7%] top-[34px] h-[112px] w-[34%] rotate-6" />
    </>
  );
}

function CartVisual({ t }: { t: Translate }) {
  return (
    <>
      <span className="absolute inset-0 bg-linear-to-br from-[#eef2f9] via-[#f7f9fc] to-[#e6f6ec]" />
      <span className="absolute left-1/2 top-[22px] w-[78%] -translate-x-1/2 rounded-[16px] border border-[#c3d6f6] bg-white p-3 shadow-[0_12px_28px_rgba(11,31,77,0.18)]">
        <span className="flex gap-3">
          <span className="relative h-[58px] w-[58px] shrink-0 overflow-hidden rounded-[10px]">
            <BannerPhoto src="/images/explore/krabi.jpg" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center justify-between gap-2">
              <span className="truncate text-[12px] font-semibold text-[#0b1f33]">Krabi</span>
              <span className="rounded-full border border-[#bbf0d0] px-2 py-0.5 text-[8px] font-bold uppercase text-[#18a957]">{t("Available")}</span>
            </span>
            <span className="mt-1 block text-[11px] font-medium text-[#d64242]">4 {t("Rai")}</span>
            <span className="block text-[10px] text-[#8a94a3]">$0.05 / {t("Rai")}</span>
          </span>
        </span>
        <span className="mt-2.5 flex items-center gap-2">
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#eef1f5]">
            <span className="block h-full w-[18%] rounded-full bg-[#e11d2e]" />
          </span>
          <span className="text-[10px] font-medium text-[#0b1f33]">4 / 100 {t("Rai")}</span>
        </span>
      </span>
      <span className="absolute bottom-[18px] left-1/2 z-10 -translate-x-1/2 rounded-full bg-navy px-5 py-2 text-[12px] font-medium text-white shadow-[0_8px_18px_rgba(11,31,77,0.35)]">
        {t("Add to Cart")}
      </span>
    </>
  );
}

function CertificateVisual() {
  return (
    <>
      <span className="absolute inset-0 bg-linear-to-br from-[#fff3cf] via-[#fffaea] to-[#fde8e8]" />
      <span className="absolute left-1/2 top-[18px] h-[250px] w-[186px] -translate-x-1/2 -rotate-3 overflow-hidden rounded-[8px] bg-white shadow-[0_14px_32px_rgba(11,31,77,0.28)]">
        <Image src="/images/home/certificate.png" alt="" fill sizes="190px" className="object-cover object-top" />
      </span>
      <span className="absolute right-[24%] top-[26px] z-10 flex h-9 w-9 items-center justify-center rounded-full bg-[#18a957] text-white shadow-[0_6px_14px_rgba(24,169,87,0.45)]">
        <svg viewBox="0 0 16 16" aria-hidden="true" className="h-4 w-4">
          <path d="m3.5 8.5 3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </>
  );
}

const STEPS: { icon: ReactNode; title: string; body: string }[] = [
  {
    icon: <GlobeIcon />,
    title: "Welcome to Tajlandia",
    body: "Own a piece of Thailand. Here is a quick look at how it works.",
  },
  {
    icon: <MapIcon />,
    title: "Explore the map",
    body: "Search a region, open any plot and see its price, size and photos.",
  },
  {
    icon: <CartIcon />,
    title: "Add plots to your cart",
    body: "Pick plots worth at least {min} Rai. Each plot is held for you for 10 minutes after you add it.",
  },
  {
    icon: <CertificateIcon />,
    title: "Checkout and get your certificate",
    body: "Pay securely and find your digital certificate and cadastre deed in My Certificates.",
  },
];

/**
 * The welcome tour: a few steps in a popup, opened from the "Take the tour" button on Help &
 * Support. A new user's first sign-in does not show it: on Home (once per user, remembered
 * in this browser) the guided "How to buy a plot" tutorial starts straight away instead.
 */
export function OnboardingTour() {
  const { t } = useDashboardLanguage();
  const minimumRai = useMinimumRai();
  const { user } = useAuth();
  const pathname = usePathname() ?? "";
  const userId = user?.id ?? "";
  // The server render counts as "seen", so nothing opens before the browser has read storage.
  const seen = useSyncExternalStore(
    subscribeSeen,
    () => (userId ? readSeen(userId) : true),
    () => true,
  );
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const nextRef = useRef<HTMLButtonElement>(null);

  // First sign-in, on Home: start the guided tutorial once instead of the welcome popup.
  const startFirstTutorial = Boolean(user?.isFirstLogin) && !seen && pathname === routes.dashboard;
  useEffect(() => {
    if (!startFirstTutorial || !userId) return;
    writeSeen(userId);
    startTutorial(FIRST_LOGIN_TUTORIAL_ID);
  }, [startFirstTutorial, userId]);

  useEffect(() => {
    function handleOpen() {
      setStep(0);
      setOpen(true);
    }
    window.addEventListener(OPEN_EVENT, handleOpen);
    return () => window.removeEventListener(OPEN_EVENT, handleOpen);
  }, []);

  function close() {
    setOpen(false);
    setStep(0);
  }

  useEffect(() => {
    if (!open) return;
    nextRef.current?.focus();
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  if (!open) return null;

  const last = step === STEPS.length - 1;
  const current = STEPS[step];
  if (!current) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-[#0b1f4d]/55 p-4 backdrop-blur-[2px]">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        // Scrolls inside on a short screen (a phone turned sideways) instead of running off it.
        className="max-h-full w-full max-w-[460px] overflow-y-auto overscroll-contain rounded-[24px] bg-white font-manrope shadow-[0_24px_60px_rgba(11,31,77,0.35)]"
      >
        {/* The pictures are all mounted (so they load once) and cross-fade, instead of being
            rebuilt on every step, which made the popup flash. */}
        <div className="relative h-[190px] overflow-hidden bg-[#eef2f9]" aria-hidden="true">
          {[
            <WelcomeVisual key="welcome" />,
            <ExploreVisual key="explore" />,
            <CartVisual key="cart" t={t} />,
            <CertificateVisual key="certificate" />,
          ].map((visual, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-300 motion-reduce:transition-none ${index === step ? "opacity-100" : "opacity-0"}`}
            >
              {visual}
            </div>
          ))}
          <span className="absolute left-4 top-4 z-20 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-brand-red shadow-sm backdrop-blur">
            {`${t("Step")} ${step + 1} / ${STEPS.length}`}
          </span>
        </div>

        <div className="relative px-6 pb-6 sm:px-7 sm:pb-7">
          <span className="-mt-7 flex h-14 w-14 items-center justify-center rounded-[16px] border-4 border-white bg-[#eef2f9] text-navy shadow-[0_6px_16px_rgba(11,31,77,0.15)]">
            {current.icon}
          </span>
          <button
            type="button"
            onClick={close}
            className="absolute right-6 top-3 cursor-pointer text-[13px] font-medium text-[#8b939e] hover:text-navy sm:right-7"
          >
            {t("Skip")}
          </button>
          <div key={step} className="motion-safe:animate-[fade-in_0.25s_ease-out]">
            <h2 id="onboarding-title" className="mt-3 pr-10 text-[22px] font-semibold leading-tight tracking-[-0.02em] text-[#1a1a1a] sm:text-[24px]">
              {t(current.title)}
            </h2>
            <p className="mt-2 min-h-24 text-[14px] leading-6 text-[#6b7785] sm:min-h-[72px]">{fill(t(current.body), { min: minimumRai })}</p>
          </div>

        {/* Phone: dots above, then Back / Next side by side across the width. */}
        <div className="mt-4 flex flex-col gap-4 sm:mt-5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <div className="flex items-center justify-center gap-1.5 sm:justify-start" aria-hidden="true">
            {STEPS.map((_, index) => (
              <span
                key={index}
                className={`h-1.5 rounded-full transition-all duration-300 ${index === step ? "w-6 bg-navy" : index < step ? "w-1.5 bg-navy/40" : "w-1.5 bg-[#d5deea]"}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="h-11 flex-1 cursor-pointer rounded-full border border-[#d5deea] px-4 text-[13px] font-medium text-navy hover:bg-[#f5f7fb] sm:h-10 sm:flex-none"
              >
                {t("Back")}
              </button>
            ) : null}
            <button
              ref={nextRef}
              type="button"
              onClick={() => (last ? close() : setStep(step + 1))}
              className="h-11 flex-1 cursor-pointer rounded-full bg-navy px-5 text-[13px] font-medium text-white hover:bg-navy-deep sm:h-10 sm:flex-none"
            >
              {t(last ? "Get started" : "Next")}
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
