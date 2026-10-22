"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Document, Page, pdfjs } from "react-pdf";

// react-pdf requires the worker to be set in the module that renders it.
pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

// Certificate artwork ratio, used until the PDF's own page size is known.
const DEFAULT_PAGE_RATIO = 646 / 941;

/**
 * Renders page 1 of a certificate PDF, fitted inside its (relative) parent.
 * Loaded through `next/dynamic` with `ssr: false` (pdf.js is browser-only).
 */
export function CertificatePdf({
  url,
  alt,
  loading,
  fallback,
}: {
  url: string;
  alt: string;
  loading: ReactNode;
  /** Shown instead when the PDF can't be fetched or rendered. */
  fallback: ReactNode;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ width: 0, height: 0 });
  const [ratio, setRatio] = useState(DEFAULT_PAGE_RATIO);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const element = boxRef.current;
    if (!element) return;
    const observer = new ResizeObserver(() => {
      setBox({ width: element.clientWidth, height: element.clientHeight });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  if (failed) return fallback;

  const pageWidth = Math.floor(Math.min(box.width, box.height * ratio));

  return (
    <div ref={boxRef} role="img" aria-label={alt} className="absolute inset-0 flex items-center justify-center overflow-hidden">
      {pageWidth > 0 ? (
        <Document file={url} suspense={false} loading={loading} error={null} onLoadError={() => setFailed(true)}>
          <Page
            pageNumber={1}
            width={pageWidth}
            suspense={false}
            loading={loading}
            error={null}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            onLoadSuccess={(page) => setRatio(page.originalWidth / page.originalHeight)}
            onLoadError={() => setFailed(true)}
            onRenderError={() => setFailed(true)}
          />
        </Document>
      ) : null}
    </div>
  );
}
