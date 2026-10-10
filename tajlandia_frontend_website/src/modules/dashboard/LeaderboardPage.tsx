"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAbortError } from "@/lib/api/browser-client";
import { isApiError } from "@/lib/api/errors";
import { isAllowedRemoteImage } from "@/lib/config/remote-images";
import { leaderboardOwnerPath, routes } from "@/lib/constants/routes";
import { useAuth } from "@/lib/hooks/useAuth";
import { logError } from "@/lib/logging/logger";
import { DashboardNavbar } from "./DashboardNavbar";
import { useDashboardLanguage } from "./DashboardLanguageContext";
import { PageLoader } from "@/components/ui/PageLoader";
import type { LeaderboardEntry } from "./schemas/leaderboard.schema";
import { getLeaderboard } from "./services/leaderboard.client";

type Owner = {
  rank: number;
  userId: string;
  name: string;
  image: string | null;
  spent: number;
  rai: number;
  plots: number;
};

type LeaderboardState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; entries: LeaderboardEntry[] };

function toOwner(entry: LeaderboardEntry, fallbackName: string): Owner {
  return {
    rank: entry.rank,
    userId: entry.userId,
    name: [entry.firstName, entry.lastName].filter(Boolean).join(" ").trim() || fallbackName,
    // Initials show when the photo is missing or from a host next/image can't load.
    image: isAllowedRemoteImage(entry.profileImage) ? entry.profileImage : null,
    spent: entry.totalPrice,
    rai: entry.totalSizeRai,
    plots: entry.totalPlots,
  };
}

const isQuietError = (error: unknown) =>
  isAbortError(error) || (isApiError(error) && error.code === "API_SESSION_EXPIRED");

// Podium order left to right: 2nd, 1st, 3rd.
const PODIUM_ORDER = [2, 1, 3] as const;

const TROPHIES = {
  1: { src: "/images/leaderboard/trophy-1.webp", width: 173, height: 196 },
  2: { src: "/images/leaderboard/trophy-2.webp", width: 238, height: 243 },
  3: { src: "/images/leaderboard/trophy-3.webp", width: 221, height: 203 },
} as const;

// Confetti around the winner, as % of the photo size: [left, top, shape, color].
const CONFETTI: [number, number, "dot" | "ring" | "square" | "plus", "navy" | "red"][] = [
  [-62, -14, "ring", "red"],
  [-30, -26, "plus", "red"],
  [-78, 30, "square", "navy"],
  [-70, 92, "ring", "navy"],
  [-48, 112, "plus", "red"],
  [62, -30, "plus", "red"],
  [118, -22, "ring", "navy"],
  [150, -8, "square", "navy"],
  [138, 28, "square", "red"],
  [158, 46, "plus", "navy"],
  [104, 92, "ring", "navy"],
  [150, 98, "dot", "navy"],
  [176, 66, "plus", "red"],
  [128, 118, "plus", "red"],
];

// The API sends no currency; amounts are USD like the rest of the dashboard.
function formatMoney(value: number) {
  const cents = Number.isInteger(value) ? 0 : 2;
  return `$ ${value.toLocaleString("en-US", { minimumFractionDigits: cents, maximumFractionDigits: cents })}`;
}

function formatRai(value: number) {
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/** The owner's photo, or their initials when there is none. */
function Avatar({
  name,
  image,
  sizes,
  className,
}: {
  name: string;
  image: string | null;
  sizes: string;
  className: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#dbe7fb] to-[#b9cdf0] font-manrope font-semibold text-navy ${className}`}
    >
      {image ? <Image src={image} alt="" fill sizes={sizes} className="object-cover" /> : initials(name)}
    </span>
  );
}

function StackIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3 w-3 shrink-0">
      <path d="M8 2 14 5 8 8 2 5 8 2Z" fill="currentColor" />
      <path d="m2 8 6 3 6-3M2 11l6 3 6-3" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

const CONFETTI_CLASS = {
  plus: { navy: "text-navy", red: "text-[#e5484d]" },
  ring: { navy: "rounded-full border-[1.5px] border-navy", red: "rounded-full border-[1.5px] border-[#e5484d]" },
  square: { navy: "bg-navy", red: "bg-[#e5484d]" },
  dot: { navy: "rounded-full bg-navy", red: "rounded-full bg-[#e5484d]" },
} as const;

function Confetti({ shape, color }: { shape: keyof typeof CONFETTI_CLASS; color: "navy" | "red" }) {
  return shape === "plus" ? (
    <span className={`block text-[14px] font-light leading-none sm:text-[20px] ${CONFETTI_CLASS.plus[color]}`}>+</span>
  ) : (
    <span className={`block h-1.5 w-1.5 sm:h-2 sm:w-2 ${CONFETTI_CLASS[shape][color]}`} />
  );
}

function PodiumCard({ owner, t }: { owner: Owner; t: (key: string) => string }) {
  const winner = owner.rank === 1;
  const trophy = TROPHIES[owner.rank as keyof typeof TROPHIES] ?? TROPHIES[3];

  return (
    <Link
      href={leaderboardOwnerPath(owner.userId)}
      aria-label={`${t("View Profile")}: ${owner.name}`}
      className={`relative flex min-w-0 flex-1 cursor-pointer flex-col items-center ${
        winner ? "max-w-[300px]" : "mt-12 max-w-[330px] sm:mt-[84px]"
      }`}
    >
      {/* The photo box: wreath, rays, confetti and trophy are placed relative to it. */}
      <div
        className={`relative z-10 shrink-0 ${
          winner ? "h-[64px] w-[64px] sm:h-[124px] sm:w-[124px]" : "h-[60px] w-[60px] sm:h-[124px] sm:w-[124px]"
        }`}
      >
        {winner ? (
          <>
            {/* White rays on a soft grey backdrop. */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-[48%] -z-10 aspect-square w-[250%] -translate-x-1/2 -translate-y-1/2 bg-[repeating-conic-gradient(from_0deg,#ffffff_0deg_5deg,#e9eef6_5deg_13deg)] [mask-image:radial-gradient(closest-side,black_30%,transparent_88%)]"
            />
            {CONFETTI.map(([left, top, shape, color]) => (
              <span
                key={`${left}-${top}`}
                aria-hidden="true"
                style={{ left: `${left}%`, top: `${top}%` }}
                className="pointer-events-none absolute -z-10"
              >
                <Confetti shape={shape} color={color} />
              </span>
            ))}
            <Image
              src="/images/leaderboard/laurel.webp"
              alt=""
              width={287}
              height={475}
              className="pointer-events-none absolute -left-[34%] top-[6%] h-[112%] w-auto -scale-x-100"
            />
            <Image
              src="/images/leaderboard/laurel.webp"
              alt=""
              width={287}
              height={475}
              className="pointer-events-none absolute -right-[34%] top-[6%] h-[112%] w-auto"
            />
          </>
        ) : null}
        <Avatar
          name={owner.name}
          image={owner.image}
          sizes="(min-width: 640px) 124px, 64px"
          className={`h-full w-full border-[3px] border-navy sm:border-[5px] ${
            winner ? "text-[18px] sm:text-[34px]" : "text-[17px] sm:text-[34px]"
          }`}
        />
        <Image
          src={trophy.src}
          alt=""
          width={trophy.width}
          height={trophy.height}
          className="absolute left-1/2 top-[80%] h-auto w-[38%] -translate-x-1/2 drop-shadow-[0_4px_6px_rgba(0,0,0,0.12)]"
        />
      </div>

      {/* Pedestal box: perspective top face (the trophy stands on it) over a fading front face. */}
      <div className="relative mt-[6px] w-full sm:mt-[15px]">
        <span
          aria-hidden="true"
          className="block h-2.5 w-full bg-gradient-to-b from-[#e2eaf7] to-[#ebf1fa] [clip-path:polygon(3.5%_0,96.5%_0,100%_100%,0_100%)] sm:h-[14px]"
        />
        <div className="flex flex-col items-center border-t border-[#d9e3f2] bg-gradient-to-b from-[#f2f6fc] via-[#f6f9fd] to-white/0 px-2 pb-6 pt-3 text-center sm:pb-10 sm:pt-5">
          <p className="relative z-20 w-full truncate font-manrope text-[13px] font-semibold text-navy sm:text-[24px]">
            {owner.name}
          </p>
          <p className="relative z-20 mt-0.5 font-manrope text-[16px] font-bold text-brand-red sm:text-[32px]">
            {formatMoney(owner.spent)}
          </p>
          <p className="relative z-20 mt-1 inline-flex items-center gap-1 font-manrope text-[10px] font-medium text-[#6b7785] sm:text-[14px]">
            <StackIcon />
            {formatRai(owner.rai)} {t("Rai")}
          </p>
        </div>
      </div>
    </Link>
  );
}

function ArrowRight() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5 shrink-0">
      <path d="M3 8h10m-4-4 4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function OwnerRow({ owner, t }: { owner: Owner; t: (key: string) => string }) {
  return (
    <li className="group relative">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-x-[8%] -inset-y-6 bg-[radial-gradient(50%_50%_at_50%_50%,rgba(242,215,165,0.55),transparent_70%)] opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100"
      />
      <Link
        href={leaderboardOwnerPath(owner.userId)}
        className={`relative flex h-[60px] cursor-pointer items-center gap-3 rounded-[14px] border-2 border-transparent px-3 font-manrope text-[13px] text-navy outline-none transition-[transform,box-shadow,color,background] duration-200 focus-visible:ring-2 focus-visible:ring-navy/40 sm:h-[72px] sm:px-4 sm:text-[15px] md:gap-4 lg:gap-5 ${
          owner.rank % 2 ? "bg-[#eef4fd]" : "bg-[#f7f9fc]"
        } hover:z-10 hover:scale-[1.03] hover:text-white hover:shadow-[0_10px_24px_-12px_rgba(0,31,84,0.7)] hover:[background:linear-gradient(90deg,#001f54,#003ba1_45%,#0045ba_70%,#003287)_padding-box,conic-gradient(#f2d7a5,#e0be82,#f2d7a5,#e0be82,#f2d7a5)_border-box] focus-visible:z-10 focus-visible:scale-[1.03] focus-visible:text-white focus-visible:shadow-[0_10px_24px_-12px_rgba(0,31,84,0.7)] focus-visible:[background:linear-gradient(90deg,#001f54,#003ba1_45%,#0045ba_70%,#003287)_padding-box,conic-gradient(#f2d7a5,#e0be82,#f2d7a5,#e0be82,#f2d7a5)_border-box]`}
      >
        <span className="w-5 shrink-0 text-center text-[#6b7785] group-hover:text-white group-focus-within:text-white md:w-6">
          {owner.rank}
        </span>
        <Avatar name={owner.name} image={owner.image} sizes="40px" className="h-8 w-8 text-[11px] sm:h-10 sm:w-10 sm:text-[13px]" />
        <div className="min-w-0 flex-1 lg:w-[170px] lg:flex-none">
          <p className="truncate font-medium">{owner.name}</p>
          <p className="truncate text-[11px] text-[#6b7785] group-hover:text-white/75 group-focus-within:text-white/75 md:hidden">
            {formatRai(owner.rai)} {t("Rai")} · {owner.plots.toLocaleString("en-US")} {t(owner.plots === 1 ? "Plot" : "Plots")}
          </p>
        </div>
        <span className="shrink-0 font-semibold md:w-[96px] md:font-normal lg:w-[140px]">{formatMoney(owner.spent)}</span>
        <span aria-hidden="true" className="hidden h-6 w-px shrink-0 bg-[#dfe5ee] group-hover:bg-white/40 group-focus-within:bg-white/40 md:block" />
        <span className="hidden shrink-0 md:block md:w-[84px] md:text-center lg:w-[120px]">
          {formatRai(owner.rai)} {t("Rai")}
        </span>
        <span aria-hidden="true" className="hidden h-6 w-px shrink-0 bg-[#dfe5ee] group-hover:bg-white/40 group-focus-within:bg-white/40 md:block" />
        <span className="hidden shrink-0 md:block md:w-[72px] md:text-center lg:w-[110px]">
          {owner.plots.toLocaleString("en-US")} {t(owner.plots === 1 ? "Plot" : "Plots")}
        </span>
        <span className="hidden flex-1 lg:block" />
        <span className="inline-flex shrink-0 items-center gap-1 font-medium">
          <span className="hidden md:inline">{t("View Profile")}</span>
          <ArrowRight />
        </span>
      </Link>
    </li>
  );
}

function LeaderboardSkeleton() {
  return (
    <div aria-hidden="true" className="motion-safe:animate-pulse">
      <div className="mx-auto mt-8 flex max-w-[1060px] items-start justify-center gap-2 sm:mt-12 sm:gap-8">
        {PODIUM_ORDER.map((rank) => (
          <div key={rank} className={`flex flex-1 flex-col items-center ${rank === 1 ? "" : "mt-12 sm:mt-[84px]"}`}>
            <span className="h-[60px] w-[60px] rounded-full bg-[#e8eef7] sm:h-[124px] sm:w-[124px]" />
            <span className="mt-6 h-3 w-3/5 rounded-full bg-[#eef2f8] sm:h-5" />
            <span className="mt-3 h-4 w-2/5 rounded-full bg-[#eef2f8] sm:h-7" />
          </div>
        ))}
      </div>
      <div className="mx-auto mt-10 flex max-w-[1148px] flex-col gap-2.5 sm:gap-3">
        {Array.from({ length: 7 }, (_, index) => (
          <span key={index} className="h-[60px] rounded-[14px] bg-[#f4f7fb] sm:h-[72px]" />
        ))}
      </div>
    </div>
  );
}

function LeaderboardMessage({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div role="status" className="mx-auto mt-10 max-w-[460px] rounded-[20px] bg-[#f7f9fc] px-6 py-10 text-center">
      <p className="font-manrope text-[17px] font-semibold text-navy">{title}</p>
      <p className="mt-2 font-manrope text-[14px] leading-6 text-[#6b7785]">{body}</p>
      {action ? (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-5 inline-flex h-11 cursor-pointer items-center justify-center rounded-[12px] bg-navy px-6 font-manrope text-[14px] font-semibold text-white transition-colors hover:bg-navy-deep"
        >
          {action.label}
        </button>
      ) : null}
    </div>
  );
}

export function LeaderboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useDashboardLanguage();
  const [state, setState] = useState<LeaderboardState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace(routes.login);
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const controller = new AbortController();
    getLeaderboard(controller.signal)
      .then((entries) => setState({ status: "ready", entries }))
      .catch((error: unknown) => {
        if (isQuietError(error)) return;
        logError(error, "Failed to load leaderboard");
        setState({ status: "error" });
      });
    return () => controller.abort();
  }, [isAuthenticated, reloadKey]);

  if (isLoading || !isAuthenticated) return <PageLoader label={t("Loading leaderboard...")} />;

  const owners =
    state.status === "ready"
      ? state.entries.map((entry) => toOwner(entry, t("Tajlandia owner"))).sort((a, b) => a.rank - b.rank)
      : [];
  const podium = PODIUM_ORDER.map((rank) => owners.find((owner) => owner.rank === rank)).filter(
    (owner): owner is Owner => Boolean(owner),
  );
  const rest = owners.filter((owner) => owner.rank > 3);

  return (
    <div className="min-h-[100svh] overflow-x-clip bg-white text-navy">
      <DashboardNavbar active="leaderboard" />
      <main className="mx-auto w-full max-w-[1240px] px-4 pb-16 pt-8 sm:px-8 sm:pt-12">
        <header className="text-center">
          <h1 className="font-[family-name:var(--font-playfair-display)] text-[36px] font-semibold leading-[1.1] tracking-[-0.02em] text-navy sm:text-[52px]">
            {t("Top")} <span className="italic text-brand-red">{t("Owner's")}</span>
          </h1>
          <p className="mx-auto mt-2 max-w-[520px] font-manrope text-[14px] leading-6 text-[#718096] sm:mt-3 sm:text-[16px]">
            {t("Discover the collectors who won the largest pieces of Thailand.")}
          </p>
        </header>

        {state.status === "loading" ? (
          <>
            <span className="sr-only" role="status">
              {t("Loading leaderboard...")}
            </span>
            <LeaderboardSkeleton />
          </>
        ) : state.status === "error" ? (
          <LeaderboardMessage
            title={t("We couldn't load the leaderboard.")}
            body={t("Please check your connection and try again.")}
            action={{
              label: t("Try again"),
              onClick: () => {
                setState({ status: "loading" });
                setReloadKey((key) => key + 1);
              },
            }}
          />
        ) : owners.length === 0 ? (
          <LeaderboardMessage
            title={t("No owners yet")}
            body={t("Rankings appear here once the first plots are purchased.")}
          />
        ) : (
          <>
            <section
              aria-label={t("Top 3 owners")}
              className="mx-auto mt-8 flex max-w-[1060px] items-start justify-center gap-2 sm:mt-12 sm:gap-8"
            >
              {podium.map((owner) => (
                <PodiumCard key={owner.userId} owner={owner} t={t} />
              ))}
            </section>

            {rest.length ? (
              <ol aria-label={t("Leaderboard")} className="mx-auto mt-4 flex max-w-[1148px] flex-col gap-2.5 sm:mt-6 sm:gap-3">
                {rest.map((owner) => (
                  <OwnerRow key={owner.userId} owner={owner} t={t} />
                ))}
              </ol>
            ) : null}
          </>
        )}
      </main>
    </div>
  );
}
