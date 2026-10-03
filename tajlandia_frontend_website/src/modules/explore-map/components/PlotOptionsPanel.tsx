"use client";

import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type PlotOptionsPanelProps = {
  icon: ReactNode;
  title: string;
  subtitle: string;
  closeLabel: string;
  /** Filter has a rule under the header; Sort does not. */
  headerDivider?: boolean;
  /** Tailwind width, e.g. "sm:w-[340px]". */
  widthClassName: string;
  onClose: () => void;
  footer: ReactNode;
  children: ReactNode;
};

/**
 * Shared frame for the Sort and Filter panels. On phones it is a centred
 * dialog over a dim backdrop; from `sm` up it drops down under its button.
 */
export function PlotOptionsPanel({
  icon,
  title,
  subtitle,
  closeLabel,
  headerDivider = false,
  widthClassName,
  onClose,
  footer,
  children,
}: PlotOptionsPanelProps) {
  const titleId = useId();

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-[#0b1f33]/30 sm:hidden"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "fixed inset-x-4 top-1/2 z-50 flex max-h-[calc(100svh-2rem)] -translate-y-1/2 flex-col overflow-hidden rounded-[16px] border border-[#f7f9fc] bg-white text-left shadow-[0_0_0_1px_rgba(11,31,51,0.06),0_20px_40px_-15px_rgba(11,31,51,0.18)]",
          "sm:absolute sm:inset-x-auto sm:left-0 sm:top-[52px] sm:max-h-[calc(100svh-12rem)] sm:translate-y-0",
          widthClassName,
        )}
      >
        <header
          className={cn(
            "flex shrink-0 items-start gap-2.5 px-5 py-4",
            headerDivider && "border-b border-[#eef1f5]",
          )}
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] bg-[#f1f4f9] text-[#001f54]">
            {icon}
          </span>
          <div className="min-w-0 flex-1">
            <h2
              id={titleId}
              className="text-[16px] font-semibold leading-5 text-[#001f54]"
            >
              {title}
            </h2>
            <p className="mt-0.5 truncate text-[11px] leading-4 text-[#6b7785]">
              {subtitle}
            </p>
          </div>
          <button
            type="button"
            aria-label={closeLabel}
            onClick={onClose}
            className="cursor-pointer -mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#8a94a3] hover:bg-[#f5f7fa] hover:text-[#001f54]"
          >
            <svg viewBox="0 0 16 16" aria-hidden="true" className="h-4 w-4">
              <path
                d="M4 4 12 12M12 4 4 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        <footer className="flex shrink-0 items-center justify-between gap-3 bg-[#f7f9fc] px-5 py-[15px]">
          {footer}
        </footer>
      </div>
    </>
  );
}

export function PanelTextButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer rounded-md px-1 text-[13px] font-medium text-[#6b7785] hover:text-[#001f54]"
    >
      {children}
    </button>
  );
}

export function PanelPrimaryButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer h-8 shrink-0 rounded-[8px] bg-[#001f54] px-5 text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:bg-[#0b2d6b]"
    >
      {children}
    </button>
  );
}
