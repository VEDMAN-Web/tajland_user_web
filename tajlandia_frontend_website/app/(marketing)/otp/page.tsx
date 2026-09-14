import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/metadata";
import { OtpPage } from "@/modules/otp";

export const metadata: Metadata = createPageMetadata({
  title: "OTP Verification",
  description: "Verify your Tajlandia account recovery request.",
  path: "/otp",
  index: false,
});

export default function OtpRoutePage() {
  return <OtpPage />;
}
