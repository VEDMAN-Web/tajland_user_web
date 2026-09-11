"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { logError } from "@/lib/logging/logger";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    logError(error, "Route error");
  }, [error]);

  return (
    <section className="flex flex-1 items-center justify-center px-6 py-24 text-center">
      <div className="max-w-md">
        <h1 className="font-display text-4xl text-navy">Something went wrong</h1>
        <p className="mt-4 text-muted">
          The page could not be loaded. You can try again, or return home.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button type="button" onClick={retry}>
            Try again
          </Button>
          <Button href="/" variant="secondary">
            Back to Home
          </Button>
        </div>
      </div>
    </section>
  );
}
