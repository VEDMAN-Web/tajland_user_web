import { StatCard } from "./StatCard";
import { cn } from "@/lib/utils/cn";

type OwnershipStats = {
  totalLandRai: string;
  plotsClaimed: number;
  regions: number;
  totalSpent: string;
};

type OwnershipOverviewProps = {
  stats: OwnershipStats;
  className?: string;
};

/**
 * "Ownership Overview / Your Collection" section.
 * Figma: rounded-18, border #e9ecef, px-24 py-20, 4-col stat grid gap-8
 */
export function OwnershipOverview({ stats, className }: OwnershipOverviewProps) {
  return (
    <section
      className={cn(
        "rounded-[18px] border border-[#e9ecef] px-4 py-5 sm:px-6 sm:py-5",
        className,
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-[family-name:var(--font-manrope)] text-[12px] font-bold uppercase tracking-[0.08em] text-[#001f54]">
            Ownership overview
          </p>
          <h2 className="mt-1 font-[family-name:var(--font-manrope)] text-[24px] font-semibold leading-[32px] text-[#111111]">
            Your Collection
          </h2>
        </div>
        <p className="hidden font-[family-name:var(--font-manrope)] text-[14px] font-bold text-[#001f54] sm:block">
          ● All holdings verified across Thailand
        </p>
      </div>

      {/* Stats grid — Figma: 4 cols on desktop, 2 on mobile, gap-8 */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        <StatCard
          icon={<LandIcon />}
          value={stats.totalLandRai}
          unit="sq ft"
          label="Total Land (5 Rai)"
          tone="blue"
        />
        <StatCard
          icon={<PlotsIcon />}
          value={String(stats.plotsClaimed)}
          label="Plots Claimed"
          tone="green"
        />
        <StatCard
          icon={<RegionIcon />}
          value={String(stats.regions).padStart(2, "0")}
          label="Regions"
          tone="purple"
        />
        <StatCard
          icon={<SpentIcon />}
          value={stats.totalSpent}
          label="Total Spent"
          tone="gold"
        />
      </div>
    </section>
  );
}

// ─── Inline stat icons (match Figma icon shapes) ──────────────────────────────
function LandIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M9 1L1 6v11h6v-5h4v5h6V6L9 1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  );
}
function PlotsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="7.5" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="9" cy="9" r="3" fill="currentColor"/>
    </svg>
  );
}
function RegionIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="1.5" y="1.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="10.5" y="1.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="1.5" y="10.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="10.5" y="10.5" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}
function SpentIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="7.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M9 4.5v9M6.5 7.5c0-1 1.12-1.5 2.5-1.5s2.5.67 2.5 1.5S11 9 9 9s-2.5.67-2.5 1.5S7.88 12 9 12s2.5-.5 2.5-1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}
