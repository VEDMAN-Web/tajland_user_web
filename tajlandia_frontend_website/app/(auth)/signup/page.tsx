import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/metadata";
import { routes } from "@/lib/constants/routes";
import { SignupPage } from "@/modules/signup";

export const metadata: Metadata = createPageMetadata({ title: "Sign Up", description: "Start your journey and claim your little piece of Thailand.", path: routes.signup, index: false });
export default function SignupRoutePage() { return <SignupPage />; }
