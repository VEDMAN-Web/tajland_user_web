"use client";

import { Component, type ReactNode } from "react";
import { handleError, type ErrorResult } from "@/lib/errors";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: ErrorResult, reset: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  error: ErrorResult | null;
}

/**
 * React Error Boundary for catching and displaying errors gracefully.
 * 
 * @example
 * <ErrorBoundary fallback={(error, reset) => <ErrorDisplay error={error} onReset={reset} />}>
 *   <YourComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { error: handleError(error) };
  }

  override componentDidCatch(error: unknown, errorInfo: React.ErrorInfo) {
    // Log to error reporting service (Sentry, LogRocket, etc.)
    if (process.env.NODE_ENV === "development") {
      console.error("[ErrorBoundary] Caught error:", error, errorInfo);
    }
  }

  reset = () => {
    this.setState({ error: null });
  };

  override render() {
    if (this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }

      // Default fallback UI
      return (
        <div className="flex min-h-[400px] items-center justify-center p-8">
          <div className="max-w-md text-center">
            <div className="mb-4 text-5xl">⚠️</div>
            <h2 className="mb-2 text-xl font-semibold text-[#0F172A]">
              Something went wrong
            </h2>
            <p className="mb-6 text-sm text-[#64748B]">
              {this.state.error.message}
            </p>
            <button
              onClick={this.reset}
              className="rounded-lg bg-[#071d52] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#0A2568]"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
