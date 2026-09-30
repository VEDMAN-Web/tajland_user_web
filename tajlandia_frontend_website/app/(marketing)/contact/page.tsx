import type { Metadata } from "next";
import { ContactPage } from "@/modules/contact";
import { createPageMetadata } from "@/lib/seo/metadata";
import { routes } from "@/lib/constants/routes";

export const metadata: Metadata = createPageMetadata({
  title: "Contact",
  description: "Get in touch with the Tajlandia team.",
  path: routes.contact,
  index: false,
});

export default function Page() {
  return <ContactPage />;
}
