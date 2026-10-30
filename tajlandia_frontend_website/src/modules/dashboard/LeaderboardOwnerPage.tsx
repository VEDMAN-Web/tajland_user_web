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
import { useDashboardLanguage } from "./DashboardLanguageContext";
import type { LeaderboardPlot, LeaderboardProfile } from "./schemas/leaderboard.schema";
import { getLeaderboardProfile } from "./services/leaderboard.client";
import { BackLink } from "@/components/ui/BackLink";
import { OwnedPlotCard } from "./OwnedPlotCard";

type ProfileState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "not-found" }
  | { status: "ready"; profile: LeaderboardProfile };

const PLOT_MAP_ZOOM = 12.5;
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
      <main className="mx-auto w-full max-w-[1180px] px-4 pb-16 pt-6 sm:px-8 sm:pt-8">
        <BackLink href={routes.leaderboard}>{t("Back to Top Owners")}</BackLink>

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
          <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
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
    <article className="group rounded-[18px] border border-[#e7edf5] bg-white px-5 py-5 shadow-[0_8px_24px_rgba(11,31,77,0.04)] transition duration-300 hover:-translate-y-1 hover:border-navy/15 hover:shadow-[0_16px_30px_-20px_rgba(11,31,77,0.35)] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <div className="flex items-center justify-between gap-3">
        <span className="shrink-0 transition-transform duration-300 group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100">
          {icon}
        </span>
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
  const images = [...(plot.images ?? []), plot.image].filter(
    (src, index, all): src is string => isAllowedRemoteImage(src) && all.indexOf(src) === index,
  );
  const place = [plot.city, plot.province].filter(Boolean).join(", ");
  const mapHref =
    plot.latitude != null && plot.longitude != null
      ? `${routes.dashboardExplore}?${new URLSearchParams({
          plotId: plot.plotId,
          // Drawn on the map right away, before Explore loads the plots in view.
          plotNumber: plot.plotName?.trim() || plot.plotCode,
          lat: String(plot.latitude),
          lng: String(plot.longitude),
          zoom: String(PLOT_MAP_ZOOM),
        }).toString()}`
      : null;

  return (
    <OwnedPlotCard
      title={plot.plotName?.trim() || plot.plotCode}
      plotCode={plot.plotCode}
      tier={plot.tier}
      location={[place, plot.zone].filter(Boolean).join(" · ")}
      images={images}
      stats={[
        { label: t("Total Rai"), value: `${number.format(plot.sizeRai)} ${t("Rai")}` },
        { label: t("Total Price"), value: formatMoney(plot.price) },
      ]}
      mapHref={mapHref}
      certificateUrl={plot.certificateUrl?.startsWith("https://") ? plot.certificateUrl : null}
      t={t}
    />
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

