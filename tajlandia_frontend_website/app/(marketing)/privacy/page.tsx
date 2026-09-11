import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/ComingSoon";
import { createPageMetadata } from "@/lib/seo/metadata";
import { routes } from "@/lib/constants/routes";

export const metadata: Metadata = createPageMetadata({
  title: "Privacy Policy",
  description: "Privacy policy will be published here.",
  path: routes.privacy,
  index: false,
});

export default function PrivacyPage() {
  return (
    <ComingSoon
      title="Privacy Policy"
      description="This legal page is a route placeholder until content is provided."
    />
  );
}
