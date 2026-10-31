import { notFound, redirect } from "next/navigation";
import { legalPagePath } from "@/lib/constants/routes";
import { fetchLegalLinks } from "@/modules/legal";

/** Old public link (sign-up, contact, ...): goes to the Terms & Conditions from the legal pages API. */
export default async function TermsPage() {
  const page = (await fetchLegalLinks()).find((item) => /terms/i.test(item.title));
  if (!page) notFound();
  redirect(legalPagePath(page.title));
}
