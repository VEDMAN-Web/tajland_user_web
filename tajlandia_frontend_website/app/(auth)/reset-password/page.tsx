import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/metadata";
import { ResetPasswordPage } from "@/modules/reset-password";

export const metadata: Metadata = createPageMetadata({ title: "Reset Password", description: "Create a new Tajlandia account password.", path: "/reset-password", index: false });
export default function ResetPasswordRoutePage() { return <ResetPasswordPage />; }
