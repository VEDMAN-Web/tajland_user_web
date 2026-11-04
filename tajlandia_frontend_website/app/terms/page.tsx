import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import { legalPagePath } from "@/lib/constants/routes";
import { fetchLegalPages } from "@/modules/legal";

/** Old public link (sign-up, contact, ...): goes to the Terms & Conditions from the legal pages API. */
export default async function TermsPage() {
  // Redirect from the live list at request time; the build must not bake in a 404.
  await connection();
  const page = (await fetchLegalPages()).find((item) => /terms/i.test(item.title));
  if (!page) notFound();
  redirect(legalPagePath(page.title));
}
