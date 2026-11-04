import { LegalDocument } from "@/components/legal/LegalDocument";
import type { LegalPageDetail } from "./schemas/legal.schema";

/** `/legal/{slug}`: a legal page from the legal pages API, on the public site. */
export function LegalPage({ page }: { page: LegalPageDetail }) {
  return <LegalDocument page={page} />;
}
