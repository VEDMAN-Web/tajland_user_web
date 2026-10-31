"use client";

import { LegalDocument, type LegalDocumentData } from "@/components/legal/LegalDocument";
import { useDashboardLanguage } from "./DashboardLanguageContext";

/** Terms / Privacy Policy inside the dashboard: the text comes from the legal pages API. */
export function DashboardLegalPage({ page }: { page: LegalDocumentData }) {
  const { t } = useDashboardLanguage();

  return (
    <LegalDocument
      embedded
      page={page}
      labels={{
        legalDocumentation: t("Legal Documentation"),
        tableOfContents: t("Table of Contents"),
        sections: t("Sections"),
        noContent: t("This document has no content yet."),
      }}
    />
  );
}
