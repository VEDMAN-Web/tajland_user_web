import type { ComponentProps } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "ghost" | "inverse";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary: "bg-navy text-white hover:bg-navy-deep focus-visible:outline-white",
  secondary: "bg-white text-navy border border-navy/15 hover:bg-navy/5",
  ghost: "bg-transparent text-navy hover:bg-navy/5",
  inverse: "bg-white text-navy hover:bg-navy hover:text-white focus-visible:outline-white",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-sm",
  lg: "h-12 px-8 text-base",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
};

type ButtonAsButton = CommonProps &
  Omit<ComponentProps<"button">, "className"> & {
    href?: undefined;
  };

type ButtonAsLink = CommonProps & Omit<ComponentProps<typeof Link>, "className">;

type ButtonProps = ButtonAsButton | ButtonAsLink;

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  const classes = cn(
    "button-animate relative inline-flex items-center justify-center rounded-full font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy overflow-hidden",
    variantClasses[variant],
    sizeClasses[size],
    className,
  );

  const shimmer = (
    <span className="button-shimmer absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20" />
  );

  if ("href" in props && props.href) {
    const { href, children, ...linkProps } = props;
    return (
      <span className="group relative inline-block">
        <Link href={href} className={classes} {...linkProps}>
          {children}
          {shimmer}
        </Link>
      </span>
    );
  }

  const { children, ...buttonProps } = props as ButtonAsButton;
  return (
    <span className="group relative inline-block">
      <button className={classes} {...buttonProps}>
        {children}
        {shimmer}
      </button>
    </span>
  );
}
