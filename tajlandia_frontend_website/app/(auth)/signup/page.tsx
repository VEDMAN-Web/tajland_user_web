import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/metadata";
import { routes } from "@/lib/constants/routes";
import { SignupPage, cleanReferralCode, fetchReferrerName } from "@/modules/signup";

export const metadata: Metadata = createPageMetadata({ title: "Sign Up", description: "Start your journey and claim your little piece of Thailand.", path: routes.signup, index: false });

export default async function SignupRoutePage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string | string[] }>;
}) {
  // A shared referral link is `/signup?ref=CODE`: the code goes into the form and on to register.
  const referralCode = cleanReferralCode((await searchParams).ref);
  const referrerName = await fetchReferrerName(referralCode);

  return <SignupPage referralCode={referralCode} referrerName={referrerName} />;
}
