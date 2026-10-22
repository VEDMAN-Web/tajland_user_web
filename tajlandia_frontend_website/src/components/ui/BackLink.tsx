import Link from "next/link";
import { cn } from "@/lib/utils/cn";

type BackLinkProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
};

/** The pill "← Back to …" link used at the top of pages. */
export function BackLink({ href, children, className }: BackLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-2 self-start rounded-full border border-[#e6e8ef] bg-white py-1 pl-1 pr-3.5 text-[13px] font-medium text-navy shadow-[0_1px_2px_rgba(11,31,77,0.06)] transition-colors hover:border-navy/25 hover:bg-[#f5f7fb] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy",
        className,
      )}
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f1f4f9] transition-colors group-hover:bg-navy group-hover:text-white">
        <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5 motion-reduce:transition-none">
          <path d="M13 8H3m4-4L3 8l4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      {children}
    </Link>
  );
}
