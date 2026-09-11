import Link from "next/link";
import type { HomeFeatureCard } from "../types/home.types";

type FeatureCardProps = {
  item: HomeFeatureCard;
};

const icons = {
  pointer: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M9 11.5V6.75a1.75 1.75 0 1 1 3.5 0V11"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M12.5 11V9.75a1.75 1.75 0 1 1 3.5 0V11"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M16 11V10.25a1.75 1.75 0 1 1 3.5 0V14.5c0 3.2-2.1 5.5-5.35 5.5H13.2c-1.7 0-3.3-.7-4.45-1.9L5.5 14.9a1.55 1.55 0 0 1 2.2-2.2L9 14"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  bag: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M6.5 9.5h11l-.7 9.2a2 2 0 0 1-2 1.8H9.2a2 2 0 0 1-2-1.8L6.5 9.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M9 9.5V8a3 3 0 0 1 6 0v1.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  ),
  gift: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <rect
        x="4.5"
        y="10"
        width="15"
        height="10"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path d="M12 7v13M4.5 14h15" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12 7c-1.8-2.4-4.5-2.6-5.3-1.3C5.7 7.2 7.2 9 12 7Zm0 0c1.8-2.4 4.5-2.6 5.3-1.3C18.3 7.2 16.8 9 12 7Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

export function FeatureCard({ item }: FeatureCardProps) {
  return (
    <Link
      href={item.href}
      className="group flex min-h-[15.5rem] min-w-0 flex-col rounded-[1.75rem] border border-[#d7e3f4] bg-[#f3f6fb] p-7 text-navy transition-colors duration-300 hover:border-navy hover:bg-navy hover:text-white focus-visible:border-navy focus-visible:bg-navy focus-visible:text-white"
    >
      <span className="mb-8 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#dce7f6] text-[#3b6fb8] transition-colors duration-300 group-hover:bg-white group-hover:text-navy group-focus-visible:bg-white group-focus-visible:text-navy">
        {icons[item.icon]}
      </span>
      <h3 className="text-xl font-semibold tracking-tight">{item.title}</h3>
      <p className="mt-3 text-sm leading-6 text-muted transition-colors duration-300 group-hover:text-white/80 group-focus-visible:text-white/80">
        {item.description}
      </p>
    </Link>
  );
}
