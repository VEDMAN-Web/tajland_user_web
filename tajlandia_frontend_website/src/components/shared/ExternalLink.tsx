import { toSafeExternalUrl } from "@/lib/security/urls";

type ExternalLinkProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
};

export function ExternalLink({ href, children, className }: ExternalLinkProps) {
  const safeUrl = toSafeExternalUrl(href);

  if (!safeUrl) {
    return <span className={className}>{children}</span>;
  }

  return (
    <a
      href={safeUrl.toString()}
      className={className}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  );
}
