import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/metadata";
import { EditProfilePage } from "@/modules/dashboard";

export const metadata: Metadata = createPageMetadata({ title: "Edit Profile", description: "Update your Tajlandia profile information.", path: "/dashboard/profile/edit", index: false });

export default function DashboardEditProfileRoutePage() {
  return <EditProfilePage />;
}
