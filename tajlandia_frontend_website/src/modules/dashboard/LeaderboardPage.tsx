"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { routes } from "@/lib/constants/routes";
import { useAuth } from "@/lib/hooks/useAuth";
import { DashboardNavbar } from "./DashboardNavbar";
import { useDashboardLanguage } from "./DashboardLanguageContext";
import { PageLoader } from "@/components/ui/PageLoader";

// Podium order left to right: 2nd, 1st, 3rd.
const PODIUM = [
  { rank: 2, height: "h-[72px]", ring: "ring-[#c7ceda]", bar: "from-[#e4e9f1] to-[#f4f6fa]" },
  { rank: 1, height: "h-[104px]", ring: "ring-[#f2c94c]", bar: "from-[#fde9a8] to-[#fff7dc]" },
  { rank: 3, height: "h-[52px]", ring: "ring-[#e0a77a]", bar: "from-[#f6dcc6] to-[#fdf1e7]" },
] as const;

function TrophyIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path
        d="M8 4h8v5a4 4 0 0 1-8 0V4Zm0 2H5a3 3 0 0 0 3 4m8-4h3a3 3 0 0 1-3 4m-4 3v4m-3 4h6m-5-4h4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Placeholder until the leaderboard design and API are ready. */
export function LeaderboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useDashboardLanguage();

  if (isLoading) return <PageLoader label={t("Loading leaderboard...")} />;
  if (!isAuthenticated) {
    router.replace(routes.login);
    return null;
  }

  return (
    <div className="min-h-[100svh] bg-[#f7f9fc] text-navy">
      <DashboardNavbar active="leaderboard" />
      <main className="mx-auto flex min-h-[calc(100svh-96px)] w-full max-w-[1240px] items-center justify-center px-4 py-10 sm:px-8">
        <section className="w-full max-w-[520px] rounded-[28px] bg-white px-6 pb-8 pt-10 text-center shadow-[0_24px_60px_-32px_rgba(11,31,77,0.35)] sm:px-10">
          <div aria-hidden="true" className="mx-auto flex max-w-[280px] items-end justify-center gap-3">
            {PODIUM.map((step) => (
              <div key={step.rank} className="flex flex-1 flex-col items-center gap-2">
                <span
                  className={`flex items-center justify-center rounded-full bg-[#f1f4f9] text-[#9aa4b2] ring-4 ${step.ring} ${step.rank === 1 ? "h-14 w-14" : "h-11 w-11"}`}
                >
                  <svg viewBox="0 0 24 24" className={step.rank === 1 ? "h-7 w-7" : "h-5 w-5"}>
                    <circle cx="12" cy="9" r="4" fill="currentColor" />
                    <path d="M4.5 20a7.5 7.5 0 0 1 15 0" fill="currentColor" />
                  </svg>
                </span>
                <span
                  className={`flex w-full items-start justify-center rounded-t-[14px] bg-gradient-to-b pt-2 text-[18px] font-semibold text-navy/70 ${step.height} ${step.bar}`}
                >
                  {step.rank}
                </span>
              </div>
            ))}
          </div>
          <span aria-hidden="true" className="mx-auto block h-px max-w-[300px] bg-[#e6e8ef]" />

          <span className="mt-8 inline-flex items-center gap-1.5 rounded-full bg-[#fff4e5] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#b45309]">
            <TrophyIcon />
            {t("Coming soon")}
          </span>
          <h1 className="mt-4 text-[28px] font-semibold tracking-[-0.03em] text-navy sm:text-[32px]">
            {t("Leaderboard")}
          </h1>
          <p className="mx-auto mt-2 max-w-[360px] text-[14px] leading-6 text-[#6b7785]">
            {t("See who holds the most land across Thailand. Rankings are on their way.")}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href={routes.dashboardExplore}
              className="inline-flex h-11 items-center justify-center rounded-[12px] bg-navy px-6 text-[14px] font-semibold text-white transition-colors hover:bg-navy-deep"
            >
              {t("Explore Map")}
            </Link>
            <Link
              href={routes.dashboard}
              className="inline-flex h-11 items-center justify-center rounded-[12px] border border-[#e6e8ef] px-6 text-[14px] font-semibold text-navy transition-colors hover:bg-[#f5f7fb]"
            >
              {t("Back to Home")}
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
