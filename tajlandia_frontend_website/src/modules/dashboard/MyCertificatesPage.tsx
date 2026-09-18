"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AccountMenu } from "./AccountMenu";
import { DashboardNavbar } from "./DashboardNavbar";
import { useAuth } from "@/lib/hooks/useAuth";
import { routes } from "@/lib/constants/routes";

type Certificate = { id?: string; title?: string; generatedAt?: string; pdfUrl?: string; previewUrl?: string };

function readCertificates(): Certificate[] {
  try {
    const stored = localStorage.getItem("tajlandia_certificates");
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed.filter((item): item is Certificate => item && typeof item === "object") : [];
  } catch {
    return [];
  }
}

export function MyCertificatesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [certificates] = useState<Certificate[]>(() => readCertificates());
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null);

  if (isLoading) return <main className="flex min-h-[100svh] items-center justify-center bg-white text-sm text-muted">Loading certificates...</main>;
  if (!isAuthenticated) { router.replace(routes.login); return null; }

  return <div className="min-h-[100svh] bg-white text-navy"><DashboardNavbar active="my-land" /><main className="mx-auto grid w-[92%] max-w-none gap-8 px-5 pb-12 pt-10 sm:px-8 lg:grid-cols-[256px_minmax(0,1fr)] lg:gap-7 lg:pt-14"><AccountMenu active="certificates" /><section className="min-w-0"><div className="border-b border-[#e1e8ed] pb-4"><h1 className="text-[30px] font-semibold tracking-[-0.04em] text-[#171717] sm:text-[32px]">My Certificates</h1><p className="mt-1 text-[12px] text-[#7b858f]">View and download your land ownership certificates.</p></div><div className="mt-5 flex items-center justify-between gap-3"><h2 className="text-[17px] font-semibold text-navy">All Certificates</h2><div className="flex gap-2"><button type="button" className="rounded-[8px] border border-[#e3e8ed] px-3 py-2 text-[10px] text-[#8f99a4]">☷ Filter</button><button type="button" className="rounded-[8px] border border-[#e3e8ed] px-3 py-2 text-[10px] text-[#8f99a4]">⇅ Sort</button></div></div>{certificates.length ? <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{certificates.map((certificate, index) => <CertificateCard key={certificate.id ?? index} certificate={certificate} onView={() => certificate.pdfUrl && setSelectedPdf(certificate.pdfUrl)} />)}</div> : <div className="flex min-h-[300px] flex-col items-center justify-center text-center"><div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#edf4ff] text-2xl text-navy">▤</div><h2 className="mt-4 text-[19px] font-semibold text-[#171717]">No certificates available</h2><p className="mt-1 max-w-[320px] text-[11px] leading-4 text-[#7b858f]">Certificates will appear here once a verified purchase has generated a real PDF certificate.</p></div>}</section></main>{selectedPdf ? <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#071536]/55 p-4 backdrop-blur-sm"><section role="dialog" aria-modal="true" aria-label="Certificate PDF viewer" className="flex h-[min(90vh,800px)] w-full max-w-[920px] flex-col overflow-hidden rounded-[12px] bg-white shadow-[0_20px_60px_rgba(11,31,77,0.25)]"><div className="flex items-center justify-between border-b border-[#e5eaf0] px-4 py-3"><h2 className="text-[13px] font-semibold text-navy">Certificate PDF</h2><button type="button" aria-label="Close PDF viewer" onClick={() => setSelectedPdf(null)} className="text-xl text-[#9aa3ad]">×</button></div><iframe title="Certificate PDF" src={selectedPdf} className="min-h-0 flex-1" /></section></div> : null}</div>;
}

function CertificateCard({ certificate, onView }: { certificate: Certificate; onView: () => void }) {
  const hasPdf = Boolean(certificate.pdfUrl);
  return <article className="rounded-[14px] bg-white p-3 shadow-[0_5px_18px_rgba(11,31,77,0.08)]"><div className="flex h-[145px] items-center justify-center overflow-hidden rounded-[8px] border border-[#edf0f3] bg-[#fafbfc]">{certificate.previewUrl ? <img src={certificate.previewUrl} alt="Certificate preview" className="h-full w-full object-contain" /> : <span className="text-[10px] text-[#aab2bd]">PDF preview unavailable</span>}</div><p className="mt-3 text-[10px] text-[#7b858f]">Generated on {certificate.generatedAt ?? "date unavailable"}</p><h3 className="mt-1 text-[11px] font-semibold text-navy">Certificate ID: {certificate.id ?? "Unavailable"}</h3><div className="mt-3 grid grid-cols-2 gap-2"><button type="button" disabled={!hasPdf} onClick={onView} className="rounded-[8px] bg-navy py-2.5 text-[10px] text-white disabled:cursor-not-allowed disabled:opacity-40">View →</button>{hasPdf ? <a href={certificate.pdfUrl} download className="rounded-[8px] bg-[#f5f8fc] py-2.5 text-center text-[10px] text-navy">⇩ Download</a> : <span className="rounded-[8px] bg-[#f5f8fc] py-2.5 text-center text-[10px] text-[#9aa3ad]">PDF unavailable</span>}</div></article>;
}
