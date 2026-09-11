"use client";

import { useEffect } from "react";
import { logError } from "@/lib/logging/logger";

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    logError(error, "Global error");
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-[#f7f8fc] px-6 text-center text-[#12203a]">
        <div>
          <h1 className="text-3xl font-semibold">Something went wrong</h1>
          <p className="mt-4 text-[#5b6578]">Please refresh the page and try again.</p>
          <button
            type="button"
            className="mt-8 rounded-full bg-[#0b1f4d] px-6 py-3 text-white"
            onClick={retry}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
