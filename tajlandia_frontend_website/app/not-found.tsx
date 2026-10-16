import { BrandLogo } from "@/components/ui/BrandLogo";
import { Button } from "@/components/ui/Button";
import { routes } from "@/lib/constants/routes";

export default function NotFound() {
  return (
    <section className="relative isolate flex min-h-screen flex-1 flex-col items-center overflow-hidden px-4 py-8 text-center sm:px-6">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(11,31,77,0.08),transparent_65%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(rgba(11,31,77,0.12)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
      />

      <BrandLogo />

      <div className="flex w-full max-w-lg flex-1 flex-col items-center justify-center py-12">
        <p className="flex items-center font-display text-[7rem] font-semibold leading-none text-navy sm:text-[10rem]">
          <span>4</span>
          <span className="text-brand-red">0</span>
          <span>4</span>
        </p>

        <h1 className="mt-6 font-display text-3xl font-semibold text-navy sm:text-4xl">
          Page not found
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
          The page you are looking for doesn&apos;t exist or may have been
          moved. Please check the URL or head back to the homepage.
        </p>

        <div className="mt-8 flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:justify-center">
          <Button href={routes.home} className="w-full sm:w-auto">
            Back to Home
          </Button>
          <Button href={routes.contact} variant="secondary" className="w-full sm:w-auto">
            Contact Us
          </Button>
        </div>
      </div>
    </section>
  );
}
