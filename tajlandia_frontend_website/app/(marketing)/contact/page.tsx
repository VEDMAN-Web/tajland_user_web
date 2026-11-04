import type { Metadata } from "next";
import { ContactPage } from "@/modules/contact";
import { getPageMetadata } from "@/lib/seo/metadata";
import { routes } from "@/lib/constants/routes";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata({
    title: "Contact",
    description:
      "Questions about Tajlandia, your certificate or a gift? Send the Tajlandia team a message and we will get back to you.",
    path: routes.contact,
  });
}

export default function Page() {
  return <ContactPage />;
}
