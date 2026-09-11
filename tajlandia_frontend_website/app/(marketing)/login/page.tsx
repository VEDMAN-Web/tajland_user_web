import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/ComingSoon";
import { createPageMetadata } from "@/lib/seo/metadata";
import { routes } from "@/lib/constants/routes";

export const metadata: Metadata = createPageMetadata({
  title: "Login",
  description: "Account access will be introduced with the authentication module.",
  path: routes.login,
  index: false,
});

export default function LoginPage() {
  return (
    <ComingSoon
      title="Login is coming soon"
      description="Authentication will be added as an independent module when account features are ready."
    />
  );
}
