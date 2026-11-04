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
import { useDashboardLanguage, useOptionalDashboardLanguage } from "./DashboardLanguageContext";
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

// `size` is the trophy's width relative to the photo. The 2nd and 3rd trophies draw their
// number on a small medallion, so they are shown larger. `medal` is the disc / ink colour of
// the place badge in front of the name.
const TROPHIES = {
  1: { src: "/images/leaderboard/trophy-1.webp", width: 173, height: 196, size: "w-[40%]", medal: null },
  2: {
    src: "/images/leaderboard/trophy-2.webp",
    width: 238,
    height: 243,
    size: "w-[54%] sm:w-[56%]",
    medal: {
      disc: "radial-gradient(circle at 35% 30%, #ffffff, #d5dbe4 55%, #9aa5b4)",
      ink: "#2c3a4d",
    },
  },
  3: {
    src: "/images/leaderboard/trophy-3.webp",
    width: 221,
    height: 203,
    size: "w-[54%] sm:w-[56%]",
    medal: {
      disc: "radial-gradient(circle at 35% 30%, #ffe2a8, #e0a252 55%, #a8661e)",
      ink: "#4a260a",
    },
  },
} as const;


// The winner's place badge (2nd and 3rd use their trophy's `medal`).
const GOLD_BADGE = {
  disc: "radial-gradient(circle at 35% 30%, #fff1c2, #f2c75c 55%, #b98a1c)",
  ink: "#4a3408",
};

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
  const [failed, setFailed] = useState(false);
  return (
    <span
      aria-hidden="true"
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#dbe7fb] to-[#b9cdf0] font-manrope font-semibold text-navy ${className}`}
    >
      {image && !failed ? (
        <Image
          src={image}
          alt=""
          fill
          sizes={sizes}
          className="object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        initials(name)
      )}
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

function PodiumCard({ owner, href, t }: { owner: Owner; href: string; t: (key: string) => string }) {
  const winner = owner.rank === 1;
  const trophy = TROPHIES[owner.rank as keyof typeof TROPHIES] ?? TROPHIES[3];
  const badge = trophy.medal ?? GOLD_BADGE;

  return (
    <Link
      href={href}
      aria-label={`${t("View Profile")}: ${owner.name}`}
      className={`relative flex min-w-0 flex-1 cursor-pointer flex-col items-center ${
        winner ? "max-w-[300px]" : "mt-12 max-w-[330px] sm:mt-[56px]"
      }`}
    >
      {/* The photo box: wreath, rays, confetti and trophy are placed relative to it. */}
      <div
        className={`relative z-10 shrink-0 ${
          winner ? "h-[64px] w-[64px] sm:h-[104px] sm:w-[104px]" : "h-[60px] w-[60px] sm:h-[104px] sm:w-[104px]"
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
          sizes="(min-width: 640px) 104px, 64px"
          className={`h-full w-full border-[3px] border-navy sm:border-[5px] ${
            winner ? "text-[18px] sm:text-[30px]" : "text-[17px] sm:text-[30px]"
          }`}
        />
        {/* Bottom-anchored on the pedestal (its gap below), since the trophies differ in height. */}
        <span
          aria-hidden="true"
          className={`absolute -bottom-3 left-1/2 block -translate-x-1/2 sm:-bottom-6 ${trophy.size}`}
        >
          <Image
            src={trophy.src}
            alt=""
            width={trophy.width}
            height={trophy.height}
            className="block h-auto w-full drop-shadow-[0_4px_6px_rgba(0,0,0,0.12)]"
          />
        </span>
      </div>

      {/* Pedestal box: perspective top face (the trophy stands on it) over a fading front face. */}
      <div className="relative mt-3 w-full sm:mt-6">
        <span
          aria-hidden="true"
          className="block h-2.5 w-full bg-gradient-to-b from-[#e2eaf7] to-[#ebf1fa] [clip-path:polygon(3.5%_0,96.5%_0,100%_100%,0_100%)] sm:h-[14px]"
        />
        <div className="flex flex-col items-center border-t border-[#d9e3f2] bg-gradient-to-b from-[#f2f6fc] via-[#f6f9fd] to-white/0 px-2 pb-6 pt-3 text-center sm:pb-5 sm:pt-4">
          <p className="relative z-20 flex w-full items-center justify-center gap-1.5 font-manrope text-[13px] font-semibold text-navy sm:gap-2.5 sm:text-[24px]">
            <span
              aria-label={`#${owner.rank}`}
              className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border border-white pb-px font-manrope text-[10px] font-bold leading-none shadow-[0_2px_6px_rgba(11,31,77,0.25)] sm:h-[30px] sm:w-[30px] sm:border-2 sm:text-[15px]"
              style={{ background: badge.disc, color: badge.ink }}
            >
              {owner.rank}
            </span>
            <span className="min-w-0 truncate">{owner.name}</span>
          </p>
          <p className="relative z-20 mt-0.5 font-manrope text-[16px] font-bold text-brand-red sm:text-[28px]">
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

/** A podium place no one holds yet (fewer than 3 owners), so the winner stays centred. */
function OpenSpotCard({ rank, href, t }: { rank: 2 | 3; href: string; t: (key: string) => string }) {
  const trophy = TROPHIES[rank];

  return (
    <Link
      href={href}
      aria-label={`#${rank} ${t("Open spot")}: ${t("Explore Map")}`}
      className="group relative mt-12 flex min-w-0 max-w-[330px] flex-1 cursor-pointer flex-col items-center sm:mt-[56px]"
    >
      <div className="relative z-10 h-[60px] w-[60px] shrink-0 sm:h-[104px] sm:w-[104px]">
        <span className="flex h-full w-full items-center justify-center rounded-full border-2 border-dashed border-[#c5d3e8] bg-[#f6f9fd] font-manrope text-[17px] font-semibold text-[#9aaac0] transition-colors group-hover:border-navy/40 group-hover:text-navy sm:border-[3px] sm:text-[30px]">
          #{rank}
        </span>
        <Image
          src={trophy.src}
          alt=""
          width={trophy.width}
          height={trophy.height}
          className={`absolute -bottom-3 left-1/2 h-auto -translate-x-1/2 opacity-40 grayscale sm:-bottom-6 ${trophy.size}`}
        />
      </div>

      <div className="relative mt-3 w-full sm:mt-6">
        <span
          aria-hidden="true"
          className="block h-2.5 w-full bg-gradient-to-b from-[#e2eaf7] to-[#ebf1fa] [clip-path:polygon(3.5%_0,96.5%_0,100%_100%,0_100%)] sm:h-[14px]"
        />
        <div className="flex flex-col items-center border-t border-[#d9e3f2] bg-gradient-to-b from-[#f2f6fc] via-[#f6f9fd] to-white/0 px-2 pb-6 pt-3 text-center sm:pb-5 sm:pt-4">
          <p className="font-manrope text-[13px] font-semibold text-[#9aaac0] sm:text-[24px]">{t("Open spot")}</p>
          <p className="mt-0.5 font-manrope text-[10px] leading-4 text-[#8b939e] sm:mt-1 sm:text-[14px] sm:leading-5">
            {t("Buy land to claim this place.")}
          </p>
          <p className="mt-1.5 inline-flex items-center gap-1 font-manrope text-[10px] font-semibold text-navy group-hover:underline sm:mt-2.5 sm:text-[14px]">
            {t("Explore Map")}
            <ArrowRight />
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

function OwnerRow({ owner, href, t }: { owner: Owner; href: string; t: (key: string) => string }) {
  return (
    <li className="group relative">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-x-[8%] -inset-y-6 bg-[radial-gradient(50%_50%_at_50%_50%,rgba(242,215,165,0.55),transparent_70%)] opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100"
      />
      <Link
        href={href}
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
      <div className="mx-auto mt-8 flex max-w-[1060px] items-start justify-center gap-2 sm:mt-8 sm:gap-8">
        {PODIUM_ORDER.map((rank) => (
          <div key={rank} className={`flex flex-1 flex-col items-center ${rank === 1 ? "" : "mt-12 sm:mt-[56px]"}`}>
            <span className="h-[60px] w-[60px] rounded-full bg-[#e8eef7] sm:h-[104px] sm:w-[104px]" />
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

type LeaderboardBoardProps = {
  state: LeaderboardState;
  onRetry: () => void;
  /** Where an owner's card or row goes. */
  ownerHref: (userId: string) => string;
  /** Where an empty podium place ("Open spot") goes. */
  exploreHref: string;
  t: (key: string) => string;
};

/** The heading, podium and list: shared by the dashboard page and the public page. */
function LeaderboardBoard({ state, onRetry, ownerHref, exploreHref, t }: LeaderboardBoardProps) {
  const owners =
    state.status === "ready"
      ? state.entries.map((entry) => toOwner(entry, t("Tajlandia owner"))).sort((a, b) => a.rank - b.rank)
      : [];
  // Each podium place with its owner, or none yet (shown as an open spot).
  const podium = PODIUM_ORDER.map((rank) => ({ rank, owner: owners.find((owner) => owner.rank === rank) }));
  const rest = owners.filter((owner) => owner.rank > 3);
  // Nothing to rank (couldn't load / no owners yet): the heading and message sit in the
  // vertical middle of the page instead of hugging the top.
  const isMessage = state.status === "error" || (state.status === "ready" && owners.length === 0);

  return (
    <div className="flex min-h-[100svh] flex-col overflow-x-clip bg-white text-navy">
      <main
        className={`mx-auto w-full max-w-[1240px] px-4 pb-16 pt-8 sm:px-8 sm:pt-8 ${isMessage ? "flex flex-1 flex-col justify-center" : ""}`}
      >
        <header className="text-center">
          <h1 className="font-[family-name:var(--font-playfair-display)] text-[36px] font-semibold leading-[1.1] tracking-[-0.02em] text-navy sm:text-[44px]">
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
            action={{ label: t("Try again"), onClick: onRetry }}
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
              className="mx-auto mt-8 flex max-w-[1060px] items-start justify-center gap-2 sm:mt-8 sm:gap-8"
            >
              {podium.map(({ rank, owner }) =>
                owner ? (
                  <PodiumCard key={owner.userId} owner={owner} href={ownerHref(owner.userId)} t={t} />
                ) : rank === 1 ? null : (
                  <OpenSpotCard key={rank} rank={rank} href={exploreHref} t={t} />
                ),
              )}
            </section>

            {rest.length ? (
              <ol aria-label={t("Leaderboard")} className="mx-auto mt-4 flex max-w-[1148px] flex-col gap-2.5 sm:mt-4 sm:gap-3">
                {rest.map((owner) => (
                  <OwnerRow key={owner.userId} owner={owner} href={ownerHref(owner.userId)} t={t} />
                ))}
              </ol>
            ) : null}
          </>
        )}
      </main>
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

  return (
    <LeaderboardBoard
      state={state}
      onRetry={() => {
        setState({ status: "loading" });
        setReloadKey((key) => key + 1);
      }}
      ownerHref={leaderboardOwnerPath}
      exploreHref={routes.dashboardExplore}
      t={t}
    />
  );
}

/**
 * The same leaderboard on the public site (`/leaderboard`), from the public endpoint. Anyone
 * can see the ranking; opening an owner (or the map) asks a visitor to log in first.
 * `entries` is null when the server couldn't load it.
 */
export function PublicLeaderboardPage({ entries }: { entries: LeaderboardEntry[] | null }) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { t } = useOptionalDashboardLanguage();
  const state: LeaderboardState = entries ? { status: "ready", entries } : { status: "error" };

  // A signed-in visitor goes straight to the owner; others log in and land there.
  const ownerHref = (userId: string) => {
    const path = leaderboardOwnerPath(userId);
    return isAuthenticated ? path : `${routes.login}?next=${encodeURIComponent(path)}`;
  };

  return (
    <LeaderboardBoard
      state={state}
      onRetry={() => router.refresh()}
      ownerHref={ownerHref}
      exploreHref={routes.explore}
      t={t}
    />
  );
}
