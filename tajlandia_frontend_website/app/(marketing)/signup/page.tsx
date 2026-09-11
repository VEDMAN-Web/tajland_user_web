import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/ComingSoon";
import { createPageMetadata } from "@/lib/seo/metadata";
import { routes } from "@/lib/constants/routes";

export const metadata: Metadata = createPageMetadata({
  title: "Sign Up",
  description: "Account registration will be introduced with the authentication module.",
  path: routes.signup,
  index: false,
});

export default function SignUpPage() {
  return (
    <ComingSoon
      title="Sign up is coming soon"
      description="Registration will be added as an independent module when account features are ready."
    />
  );
}
