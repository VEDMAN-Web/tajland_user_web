import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { HomeMedia } from "../components/HomeMedia";
import type { HomePageContent } from "../types/home.types";

type TestimonialsSectionProps = {
  content: HomePageContent["testimonials"];
};

export function TestimonialsSection({ content }: TestimonialsSectionProps) {
  const [featured, ...rest] = content.items;

  if (!featured) {
    return null;
  }

  return (
    <section className="bg-[#F7F8FC] py-16 md:py-24">
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="min-w-0">
            <SectionHeading align="left" eyebrow={content.eyebrow} className="mb-0">
              {content.headingBefore}{" "}
              <span className="font-display italic text-brand-red">
                {content.headingAccent}
              </span>
            </SectionHeading>
            {rest.length > 0 ? (
              <ul className="mt-8 space-y-4">
                {rest.map((item) => (
                  <li key={item.id} className="rounded-[1.5rem] bg-white p-5 shadow-sm">
                    <p className="text-navy">{item.quote}</p>
                    <p className="mt-3 text-sm font-semibold text-navy">{item.name}</p>
                    <p className="text-sm text-muted">{item.role}</p>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <figure className="relative min-h-[22rem] min-w-0 overflow-hidden rounded-[2rem] bg-navy shadow-[0_18px_50px_rgba(11,31,77,0.18)] sm:min-h-[26rem]">
            {featured.image ? (
              <HomeMedia
                image={featured.image}
                fill
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover"
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-t from-navy/85 via-navy/25 to-transparent" />
            <figcaption className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
              {content.rating ? (
                <p className="mb-3 text-sm font-semibold tracking-wide text-white/90">
                  {content.rating.score} · {content.rating.label}
                </p>
              ) : null}
              <blockquote className="text-base leading-7 sm:text-lg">
                “{featured.quote}”
              </blockquote>
              <p className="mt-4 text-sm font-semibold">{featured.name}</p>
              <p className="text-sm text-white/75">{featured.role}</p>
            </figcaption>
          </figure>
        </div>
      </Container>
    </section>
  );
}
