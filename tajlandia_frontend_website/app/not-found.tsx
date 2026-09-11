import Link from "next/link";
import { routes } from "@/lib/constants/routes";

export default function NotFound() {
  return (
    <section className="flex flex-1 items-center justify-center px-6 py-24 text-center">
      <div className="max-w-md">
        <h1 className="font-display text-4xl text-navy">Page not found</h1>
        <p className="mt-4 text-muted">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href={routes.home}
          className="mt-8 inline-flex h-11 items-center rounded-full bg-navy px-6 text-sm font-medium text-white"
        >
          Back to Home
        </Link>
      </div>
    </section>
  );
}
