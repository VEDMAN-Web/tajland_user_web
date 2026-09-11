import { cn } from "@/lib/utils/cn";

type SectionHeadingProps = {
  eyebrow?: string;
  description?: string;
  children: React.ReactNode;
  align?: "left" | "center";
  className?: string;
};

export function SectionHeading({
  eyebrow,
  description,
  children,
  align = "center",
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn("mb-10 md:mb-14", align === "center" && "text-center", className)}>
      {eyebrow ? (
        <p className="mb-3 text-sm font-medium tracking-wide text-muted">{eyebrow}</p>
      ) : null}
      <h2 className="font-display text-3xl font-semibold tracking-tight text-navy md:text-5xl">
        {children}
      </h2>
      {description ? (
        <p
          className={cn(
            "mt-4 max-w-2xl text-base leading-7 text-muted md:text-lg",
            align === "center" && "mx-auto",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
