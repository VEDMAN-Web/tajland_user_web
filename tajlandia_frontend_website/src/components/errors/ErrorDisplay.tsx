import Link from "next/link";
import { routes } from "@/lib/constants/routes";
import { Button } from "@/components/ui/Button";
import type { ErrorResult } from "@/lib/errors";

interface ErrorDisplayProps {
  error: ErrorResult;
  onReset?: () => void;
  showHomeButton?: boolean;
}

/**
 * Reusable error display component.
 * Shows user-friendly error messages with appropriate actions.
 */
export function ErrorDisplay({ 
  error, 
  onReset, 
  showHomeButton = true 
}: ErrorDisplayProps) {
  return (
    <div className="flex min-h-[500px] items-center justify-center bg-[#F9FAFB] px-4 py-12">
      <div className="mx-auto max-w-md text-center">
        {/* Error Icon */}
        <div className="mb-6">
          {error.statusCode === 404 ? (
            <span className="text-7xl">🔍</span>
          ) : error.statusCode === 403 ? (
            <span className="text-7xl">🔒</span>
          ) : error.statusCode === 500 ? (
            <span className="text-7xl">⚠️</span>
          ) : (
            <span className="text-7xl">❌</span>
          )}
        </div>

        {/* Error Code */}
        <div className="mb-2 text-sm font-semibold uppercase tracking-wider text-[#9CA3AF]">
          Error {error.statusCode}
        </div>

        {/* Error Message */}
        <h1 className="mb-3 text-2xl font-bold text-[#0F172A]">
          {getErrorTitle(error.statusCode)}
        </h1>
        
        <p className="mb-8 text-[14px] leading-relaxed text-[#64748B]">
          {error.message}
        </p>

        {/* Validation Details */}
        {error.details && Object.keys(error.details).length > 0 ? (
          <div className="mb-8 rounded-lg border border-[#FFE4E6] bg-[#FFF1F2] p-4 text-left">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#DC2626]">
              Validation Errors:
            </p>
            <ul className="space-y-1 text-sm text-[#0F172A]">
              {Object.entries(error.details).map(([field, message]) => (
                <li key={field} className="flex items-start gap-2">
                  <span className="text-[#DC2626]">•</span>
                  <span>
                    <strong>{field}:</strong> {message}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          {onReset ? (
            <Button
              onClick={onReset}
              className="h-11 rounded-lg bg-[#071d52] px-8 text-[14px] font-medium text-white shadow-lg shadow-[#071d52]/20 transition hover:bg-[#0A2568]"
            >
              Try Again
            </Button>
          ) : null}
          
          {showHomeButton ? (
            <Link href={routes.home}>
              <Button className="h-11 w-full rounded-lg border-2 border-[#E5E7EB] bg-white px-8 text-[14px] font-medium text-[#0F172A] transition hover:bg-[#F9FAFB] sm:w-auto">
                Back to Home
              </Button>
            </Link>
          ) : null}
        </div>

        {/* Support Link */}
        <div className="mt-8 text-xs text-[#9CA3AF]">
          Need help?{" "}
          <Link href={routes.contact} className="text-[#2563EB] hover:underline">
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}

function getErrorTitle(statusCode: number): string {
  switch (statusCode) {
    case 400:
      return "Invalid Request";
    case 401:
      return "Authentication Required";
    case 403:
      return "Access Denied";
    case 404:
      return "Page Not Found";
    case 409:
      return "Conflict";
    case 429:
      return "Too Many Requests";
    case 500:
      return "Server Error";
    case 503:
      return "Service Unavailable";
    default:
      return "Something Went Wrong";
  }
}
