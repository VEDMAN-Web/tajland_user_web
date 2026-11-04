export { LegalPage } from "./LegalPage";
export type { LegalKind } from "./services/legal.api";
export type { LegalPageDetail, LegalPageListItem } from "./schemas/legal.schema";
// Server-only: for the route files under app/(marketing)/legal and the footer.
export { fetchLegalLinks, fetchLegalPageByKind, fetchLegalPageBySlug, fetchLegalPages } from "./services/legal.api";
