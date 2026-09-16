import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/metadata";
import { ForgotPasswordPage } from "@/modules/forgot-password";

export const metadata: Metadata = createPageMetadata({ title: "Forgot Password", description: "Recover access to your Tajlandia account.", path: "/forgot-password", index: false });
export default function ForgotPasswordRoutePage() { return <ForgotPasswordPage />; }
