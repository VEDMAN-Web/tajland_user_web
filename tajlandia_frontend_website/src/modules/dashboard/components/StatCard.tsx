import { cn } from "@/lib/utils/cn";

// Figma colors for each stat tone
const toneStyles = {
  blue:   { bg: "#eaf3ff", value: "#001f54", label: "#818d97" },
  green:  { bg: "#e6f9ee", value: "#00a63d", label: "#818d97" },
  purple: { bg: "#f3e8ff", value: "#6e0499", label: "#818d97" },
  gold:   { bg: "#f7e8b5", value: "#c9a227", label: "#818d97" },
} as const;

type StatCardProps = {
  /** SVG icon or emoji */
  icon: React.ReactNode;
  value: string;
  label: string;
  tone: keyof typeof toneStyles;
  unit?: string;
  className?: string;
};

/**
 * Stat card — matches Figma Dashboard "Ownership Overview" grid.
 * Figma specs: rounded-10, p-12, value=20px/900 Manrope, label=14px/600 muted
 */
export function StatCard({ icon, value, label, tone, unit, className }: StatCardProps) {
  const { bg, value: valueColor, label: labelColor } = toneStyles[tone];

  return (
    <div
      className={cn("min-h-[88px] rounded-[10px] p-3", className)}
      style={{ backgroundColor: bg }}
    >
      {/* Icon row */}
      <div className="text-[16px]" style={{ color: valueColor }}>
        {icon}
      </div>

      {/* Value */}
      <p
        className="mt-2 font-[family-name:var(--font-manrope)] text-[20px] font-black leading-[27px]"
        style={{ color: valueColor }}
      >
        {value}
        {unit && (
          <span className="ml-1 text-[13px] font-semibold">{unit}</span>
        )}
      </p>

      {/* Label */}
      <p
        className="mt-0.5 font-[family-name:var(--font-manrope)] text-[14px] font-semibold leading-[19px]"
        style={{ color: labelColor }}
      >
        {label}
      </p>
    </div>
  );
}
