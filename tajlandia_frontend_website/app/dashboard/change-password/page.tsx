import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/metadata";
import { ChangePasswordPage } from "@/modules/dashboard";

export const metadata: Metadata = createPageMetadata({ title: "Change Password", description: "Update your Tajlandia account password.", path: "/dashboard/change-password", index: false });

export default function DashboardChangePasswordRoutePage() {
  return <ChangePasswordPage />;
}
