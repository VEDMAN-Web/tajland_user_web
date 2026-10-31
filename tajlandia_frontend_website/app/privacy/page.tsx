import { notFound, redirect } from "next/navigation";
import { legalPagePath } from "@/lib/constants/routes";
import { fetchLegalLinks } from "@/modules/legal";

/** Old public link (sign-up, contact, ...): goes to the Privacy Policy from the legal pages API. */
export default async function PrivacyPage() {
  const page = (await fetchLegalLinks()).find((item) => /privacy/i.test(item.title));
  if (!page) notFound();
  redirect(legalPagePath(page.title));
}
