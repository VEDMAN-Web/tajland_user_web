import { cn } from "@/lib/utils/cn";

type CardProps = {
  children: React.ReactNode;
  className?: string;
};

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[1.75rem] border border-line bg-card p-6 shadow-[0_12px_40px_rgba(11,31,77,0.06)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
