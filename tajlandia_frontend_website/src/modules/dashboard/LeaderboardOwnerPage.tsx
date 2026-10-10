"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { isAbortError } from "@/lib/api/browser-client";
import { isApiError } from "@/lib/api/errors";
import { isAllowedRemoteImage } from "@/lib/config/remote-images";
import { routes } from "@/lib/constants/routes";
import { useAuth } from "@/lib/hooks/useAuth";
import { logError } from "@/lib/logging/logger";
import { PageLoader } from "@/components/ui/PageLoader";
import { DashboardNavbar } from "./DashboardNavbar";
import { useDashboardLanguage } from "./DashboardLanguageContext";
import type { LeaderboardPlot, LeaderboardProfile } from "./schemas/leaderboard.schema";
import { getLeaderboardProfile } from "./services/leaderboard.client";

type ProfileState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "not-found" }
  | { status: "ready"; profile: LeaderboardProfile };

const PLOT_PLACEHOLDER_IMAGE = "/images/explore/place-placeholder.svg";
const PLOT_MAP_ZOOM = 12.5;
const TIER_BADGES: Record<string, string> = {
  ICON: "bg-[#fff6d6] text-[#c4a035]",
  POPULAR: "bg-[#e3f4f3] text-[#16807f]",
  STANDARD: "bg-[#eef1f4] text-[#6b7785]",
};
const number = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

const isQuietError = (error: unknown) =>
  isAbortError(error) || (isApiError(error) && error.code === "API_SESSION_EXPIRED");

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

// The API sends no currency; amounts are USD like the rest of the dashboard.
function formatMoney(value: number) {
  const cents = Number.isInteger(value) ? 0 : 2;
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: cents, maximumFractionDigits: cents })}`;
}

export function LeaderboardOwnerPage({ userId }: { userId: string }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useDashboardLanguage();
  const [state, setState] = useState<ProfileState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace(routes.login);
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const controller = new AbortController();
    getLeaderboardProfile(userId, controller.signal)
      .then((profile) => setState({ status: "ready", profile }))
      .catch((error: unknown) => {
        if (isQuietError(error)) return;
        // 400 malformed id, 404 unknown user (the proxy also 404s unsafe ids).
        if (isApiError(error) && (error.status === 400 || error.status === 404)) {
          setState({ status: "not-found" });
          return;
        }
        logError(error, "Failed to load leaderboard profile");
        setState({ status: "error" });
      });
    return () => controller.abort();
  }, [isAuthenticated, userId, reloadKey]);

  if (isLoading || !isAuthenticated) return <PageLoader label={t("Loading profile...")} />;

  return (
    <div className="min-h-[100svh] bg-white text-navy">
      <DashboardNavbar active="leaderboard" />
      <main className="mx-auto w-full max-w-[1180px] px-4 pb-16 pt-6 sm:px-8 sm:pt-8">
        <Link
          href={routes.leaderboard}
          className="inline-flex cursor-pointer items-center gap-2 font-manrope text-[14px] font-medium text-navy hover:text-navy-deep"
        >
          <ArrowLeft />
          {t("Back to Top Owners")}
        </Link>

        {state.status === "loading" ? (
          <>
            <span className="sr-only" role="status">
              {t("Loading profile...")}
            </span>
            <ProfileSkeleton />
          </>
        ) : state.status === "ready" ? (
          <OwnerProfile profile={state.profile} t={t} />
        ) : (
          <div role="status" className="mt-8 rounded-[20px] border border-[#e7edf5] bg-white px-6 py-14 text-center">
            <p className="font-manrope text-[16px] font-medium text-navy">
              {state.status === "not-found"
                ? t("This owner is not on the leaderboard.")
                : t("We couldn't load this profile.")}
            </p>
            {state.status === "error" ? (
              <>
                <p className="mt-2 font-manrope text-[14px] text-[#6b7785]">
                  {t("Please check your connection and try again.")}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setState({ status: "loading" });
                    setReloadKey((key) => key + 1);
                  }}
                  className="mt-4 inline-flex h-11 cursor-pointer items-center rounded-[12px] bg-navy px-5 font-manrope text-[14px] font-medium text-white hover:bg-navy-deep"
                >
                  {t("Try again")}
                </button>
              </>
            ) : (
              <Link
                href={routes.leaderboard}
                className="mt-4 inline-flex h-11 cursor-pointer items-center rounded-[12px] bg-navy px-5 font-manrope text-[14px] font-medium text-white hover:bg-navy-deep"
              >
                {t("Back to Top Owners")}
              </Link>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div aria-hidden="true" className="motion-safe:animate-pulse">
      <div className="mt-5 flex items-center gap-4 rounded-[22px] border border-[#e7edf5] px-5 py-5 sm:px-7 sm:py-6">
        <span className="h-[72px] w-[72px] shrink-0 rounded-full bg-[#eef2f8]" />
        <div className="flex-1">
          <span className="block h-6 w-48 max-w-full rounded-full bg-[#eef2f8]" />
          <span className="mt-2 block h-4 w-32 rounded-full bg-[#f3f6fa]" />
        </div>
      </div>
      <div className="mt-12 grid grid-cols-1 gap-3 md:grid-cols-3">
        {[0, 1, 2].map((key) => (
          <span key={key} className="h-[156px] rounded-[18px] bg-[#f4f7fb]" />
        ))}
      </div>
      <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((key) => (
          <span key={key} className="h-[300px] rounded-[16px] bg-[#f4f7fb]" />
        ))}
      </div>
    </div>
  );
}

function OwnerProfile({
  profile,
  t,
}: {
  profile: LeaderboardProfile;
  t: (source: string) => string;
}) {
  const { user, overview, plots } = profile;
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || t("Tajlandia owner");
  const photo = isAllowedRemoteImage(user.profileImage) ? user.profileImage : null;
  const standing =
    user.rank === null ? t("Not ranked yet") : user.rank === 1 ? t("National Top Tier") : t("Top Owners");

  return (
    <>
      <section className="relative mt-5 overflow-hidden rounded-[22px] border border-[#e7edf5] bg-white px-5 py-5 shadow-[0_10px_30px_rgba(11,31,77,0.04)] sm:px-7 sm:py-6">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-8 -top-20 h-64 w-80 bg-[radial-gradient(circle,rgba(234,243,255,0.95),transparent_68%)]"
        />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            {/* Photo inside a soft grey ring, verified badge on the ring's lower right. */}
            <span className="relative h-[80px] w-[80px] shrink-0 rounded-full bg-[#e3e9f2] p-[5px] shadow-[0_2px_6px_rgba(0,31,84,0.06)] sm:h-[104px] sm:w-[104px] sm:p-[7px]">
              <span
                aria-hidden="true"
                className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#dbe7fb] to-[#b9cdf0] font-manrope text-[24px] font-semibold text-navy sm:text-[30px]"
              >
                {photo ? (
                  <Image src={photo} alt="" fill sizes="(min-width: 640px) 90px, 70px" className="object-cover" />
                ) : (
                  initials(name)
                )}
              </span>
              <ShieldBadge />
            </span>
            <div className="min-w-0">
              <h1 className="truncate font-manrope text-[22px] font-semibold tracking-[-0.02em] text-navy sm:text-[26px]">
                {name}
              </h1>
              {user.memberSince ? (
                <p className="mt-1 inline-flex items-center gap-1.5 font-manrope text-[13px] text-[#8b939e]">
                  <HistoryIcon />
                  {t("Member since")} {user.memberSince}
                </p>
              ) : null}
            </div>
          </div>

          <div className="sm:text-right">
            <p className="font-manrope text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8b939e]">
              {t("Cadastral Standing")}
            </p>
            <p className="mt-1 font-manrope text-[28px] font-bold leading-none tracking-[-0.03em] text-brand-red sm:text-[32px]">
              {user.rank === null ? "—" : `${t("Rank")} #${user.rank}`}
            </p>
            <p className="mt-1.5 font-manrope text-[13px] text-[#8b939e]">{standing}</p>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <p className="font-manrope text-[11px] font-bold uppercase tracking-[0.16em] text-brand-red">
          {t("Your Land Archive")}
        </p>
        <h2 className="mt-1.5 font-manrope text-[22px] font-semibold tracking-[-0.02em] text-navy sm:text-[26px]">
          {t("Ownership Overview")}
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <StatCard
            icon={<DollarIcon />}
            eyebrow={t("Fiscal assessment")}
            title={t("Collection Value")}
            value={formatMoney(overview.totalPrice)}
            suffix="USD"
            detail={t("Current estimated value of your collection")}
          />
          <StatCard
            icon={<LocationIcon />}
            eyebrow={t("Surface Area")}
            title={t("Total Land (5 Rai)")}
            value={number.format(overview.totalSizeRai)}
            suffix={t("rai")}
            detail={t("Combined area across all owned land")}
          />
          <StatCard
            icon={<LayersIcon />}
            eyebrow={t("Asset Diversity")}
            title={t("Plots Owned")}
            value={number.format(overview.totalPlots)}
            suffix={t("plots")}
            detail={t("Total number of plots in your collection")}
          />
        </div>
      </section>

      <section className="mt-8">
        <p className="font-manrope text-[11px] font-bold uppercase tracking-[0.16em] text-brand-red">
          {t("Your Land Archive")}
        </p>
        <h2 className="mt-1.5 font-manrope text-[22px] font-semibold tracking-[-0.02em] text-navy sm:text-[26px]">
          {t("View Plots")}
        </h2>
        {plots.length ? (
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {plots.map((plot) => (
              <PlotCard key={plot.plotId} plot={plot} t={t} />
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-[16px] bg-[#f7f9fc] px-5 py-10 text-center font-manrope text-[14px] text-[#6b7785]">
            {t("This owner has no plots yet.")}
          </p>
        )}
      </section>
    </>
  );
}

function StatCard({
  icon,
  eyebrow,
  title,
  value,
  suffix,
  detail,
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  value: string;
  suffix: string;
  detail: string;
}) {
  return (
    <article className="rounded-[18px] border border-[#e7edf5] bg-white px-5 py-5 shadow-[0_8px_24px_rgba(11,31,77,0.04)]">
      <div className="flex items-center justify-between gap-3">
        <span className="shrink-0">{icon}</span>
        <p className="rounded-full bg-[#f2f4f7] px-2.5 py-1 font-manrope text-[11px] font-medium leading-none text-[#8b939e]">
          {eyebrow}
        </p>
      </div>
      <p className="mt-5 font-manrope text-[14px] font-medium text-[#8b939e]">{title}</p>
      <p className="mt-1.5 break-words font-manrope text-[32px] font-bold leading-none tracking-[-0.03em] text-navy">
        {value}
        <span className="ml-1.5 align-baseline text-[15px] font-medium tracking-normal text-[#98a2b3]">
          {suffix}
        </span>
      </p>
      <p className="mt-2 font-manrope text-[13px] leading-5 text-[#98a2b3]">{detail}</p>
    </article>
  );
}

function PlotCard({
  plot,
  t,
}: {
  plot: LeaderboardPlot;
  t: (source: string) => string;
}) {
  const tier = plot.tier.toUpperCase();
  const tierLabel = tier.charAt(0) + tier.slice(1).toLowerCase();
  const title = plot.plotName?.trim() || plot.plotCode;
  const place = [plot.city, plot.province].filter(Boolean).join(", ");
  const location = [place, plot.zone].filter(Boolean).join(" · ");
  const mapHref =
    plot.latitude != null && plot.longitude != null
      ? `${routes.dashboardExplore}?${new URLSearchParams({
          plotId: plot.plotId,
          // Drawn on the map right away, before Explore loads the plots in view.
          plotNumber: plot.plotCode,
          lat: String(plot.latitude),
          lng: String(plot.longitude),
          zoom: String(PLOT_MAP_ZOOM),
        }).toString()}`
      : null;
  const certificateUrl = plot.certificateUrl?.startsWith("https://") ? plot.certificateUrl : null;
  const buttonBase = "inline-flex h-10 items-center rounded-[10px] px-4 font-manrope text-[13px] font-medium";

  return (
    <article className="overflow-hidden rounded-[16px] border border-[#eef1f4] bg-white shadow-[0_8px_22px_rgba(11,31,77,0.05)]">
      <div className="relative h-[168px] w-full bg-[#eef1f5]">
        <Image
          src={isAllowedRemoteImage(plot.image) ? plot.image : PLOT_PLACEHOLDER_IMAGE}
          alt={title}
          fill
          sizes="(min-width: 1280px) 360px, (min-width: 768px) 50vw, 100vw"
          className="object-cover"
        />
      </div>
      <div className="px-4 pb-4 pt-3">
        <div className="flex items-center justify-between gap-2">
          <span className="min-w-0 truncate font-manrope text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8b939e]">
            {[plot.province, plot.plotCode].filter(Boolean).join(" · ")}
          </span>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 font-manrope text-[10px] font-semibold uppercase tracking-[0.04em] ${
              TIER_BADGES[tier] ?? TIER_BADGES.STANDARD
            }`}
          >
            {t(tierLabel)}
          </span>
        </div>
        <h3 className="mt-2 truncate font-manrope text-[16px] font-semibold leading-5 text-[#1a1a1a]">{title}</h3>
        {location ? (
          <p className="mt-1 flex items-center gap-1 font-manrope text-[12px] leading-4 text-[#8b939e]">
            <PinIcon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{location}</span>
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {mapHref ? (
            <Link href={mapHref} className={`${buttonBase} cursor-pointer bg-navy text-white hover:bg-navy-deep`}>
              {t("View Map")} →
            </Link>
          ) : (
            <span aria-disabled="true" className={`${buttonBase} cursor-not-allowed bg-navy/40 text-white`}>
              {t("View Map")} →
            </span>
          )}
          {certificateUrl ? (
            <a
              href={certificateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`${buttonBase} cursor-pointer border border-[#e4e9ef] bg-white text-navy hover:bg-[#f5f7fb]`}
            >
              {t("View Certificate")}
            </a>
          ) : (
            <span
              aria-disabled="true"
              title={t("Certificate not ready yet")}
              className={`${buttonBase} cursor-not-allowed border border-[#e4e9ef] bg-white text-[#b0b7c0]`}
            >
              {t("View Certificate")}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

function ArrowLeft() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="h-4 w-4 shrink-0">
      <path d="M13 8H3m4-4-4 4 4 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShieldBadge() {
  return (
    <svg viewBox="0 0 36 36" aria-hidden="true" className="absolute bottom-[-2%] right-[-4%] h-[30%] w-[30%]">
      <circle cx="18" cy="18" r="18" fill="#001F54" />
      <path
        d="M18 8.6 25.2 11.4v5.4c0 4-2.9 6.8-7.2 8.4-4.3-1.6-7.2-4.4-7.2-8.4v-5.4L18 8.6Z"
        fill="none"
        stroke="#fff"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="m14.4 16.8 2.5 2.5 4.7-4.9"
        fill="none"
        stroke="#fff"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Clock with a counter-clockwise arrow ("history").
function HistoryIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 shrink-0 text-[#8b939e]">
      <path
        d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18Zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12Z"
        fill="currentColor"
      />
    </svg>
  );
}

function StatIcon({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-[38px] w-[38px] items-center justify-center rounded-[12px] bg-[#eaf3ff] text-navy">
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
        {children}
      </svg>
    </span>
  );
}

function DollarIcon() {
  return (
    <StatIcon>
      <circle cx="12" cy="12" r="9" fill="currentColor" />
      <path
        d="M14.6 9.4c-.3-.9-1.3-1.5-2.6-1.5-1.5 0-2.6.8-2.6 1.9 0 2.6 5.3 1.4 5.3 4.1 0 1.1-1.1 2-2.7 2-1.4 0-2.4-.6-2.7-1.6M12 6.6v1.3m0 8.2v1.3"
        fill="none"
        stroke="#fff"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </StatIcon>
  );
}

function LocationIcon() {
  return (
    <StatIcon>
      <path
        d="M12 2.5a7 7 0 0 0-7 7c0 5 7 12 7 12s7-7 7-12a7 7 0 0 0-7-7Zm0 9.6a2.6 2.6 0 1 1 0-5.2 2.6 2.6 0 0 1 0 5.2Z"
        fill="currentColor"
      />
    </StatIcon>
  );
}

function LayersIcon() {
  return (
    <StatIcon>
      <path d="M12 3 21.5 8 12 13 2.5 8 12 3Z" fill="currentColor" />
      <path
        d="m2.5 12 9.5 5 9.5-5M2.5 16l9.5 5 9.5-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </StatIcon>
  );
}

function PinIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={className}>
      <path
        d="M8 14s4.5-4.1 4.5-7.2A4.5 4.5 0 0 0 8 2.3a4.5 4.5 0 0 0-4.5 4.5C3.5 9.9 8 14 8 14Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <circle cx="8" cy="6.7" r="1.4" fill="currentColor" />
    </svg>
  );
}

