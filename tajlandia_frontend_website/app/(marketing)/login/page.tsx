import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/metadata";
import { routes } from "@/lib/constants/routes";
import { LoginPage } from "@/modules/login";

export const metadata: Metadata = createPageMetadata({
  title: "Login",
  description: "Sign in to continue your Tajlandia journey.",
  path: routes.login,
  index: false,
});

export default function LoginRoutePage() {
  return <LoginPage />;
}
