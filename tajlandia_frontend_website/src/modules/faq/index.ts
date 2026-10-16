export { FAQPage } from "./FAQPage";
export type { FaqItem } from "./schemas/faq.schema";
// Server-only: for the route file at app/(marketing)/faq.
export { fetchFaqs } from "./services/faq.api";
