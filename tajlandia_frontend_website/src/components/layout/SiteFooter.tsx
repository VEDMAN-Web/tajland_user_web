"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Container } from "@/components/ui/Container";
import { ScrollAnimatedElement } from "@/components/animations/ScrollAnimatedElement";
import { routes } from "@/lib/constants/routes";

function generateStarField(
  width: number = 1200,
  height: number = 600,
): React.ReactNode[] {
  const stars = [];
  const starCount = 180;

  for (let i = 0; i < starCount; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const radius = Math.random() * 0.8 + 0.3;
    const opacity = Math.random() * 0.6 + 0.4;

    stars.push(
      <circle key={i} cx={x} cy={y} r={radius} fill="black" opacity={opacity} />,
    );
  }

  return stars;
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-brand-red">
      <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-brand-red">
      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-brand-red">
      <path d="M12 2C7.13 2 3 6.13 3 11c0 5.25 9 13 9 13s9-7.75 9-13c0-4.87-4.13-9-9-9zm0 11.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
    </svg>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group relative inline-block pb-[3px] text-left text-[15px] font-medium text-[#636363] transition-colors duration-200 hover:text-navy"
    >
      {children}
      <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-[#c81e1e] transition-all duration-300 group-hover:w-full" />
    </Link>
  );
}

function FooterText({ children }: { children: React.ReactNode }) {
  return (
    <span className="group relative inline-block cursor-pointer pb-[3px] text-left text-[15px] font-medium text-[#636363] transition-colors duration-200 hover:text-navy">
      {children}
      <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-[#c81e1e] transition-all duration-300 group-hover:w-full" />
    </span>
  );
}

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden bg-[#F7F9FC] text-navy">
      {/* Animated stars background - Full footer area */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(1px 1px at 3% 10%, black, rgba(0,0,0,0)),
            radial-gradient(1.5px 1.5px at 8% 28%, black, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 12% 50%, black, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 16% 72%, black, rgba(0,0,0,0)),
            radial-gradient(1.5px 1.5px at 20% 35%, black, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 25% 15%, black, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 30% 65%, black, rgba(0,0,0,0)),
            radial-gradient(1.5px 1.5px at 35% 42%, black, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 40% 82%, black, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 45% 25%, black, rgba(0,0,0,0)),
            radial-gradient(1.5px 1.5px at 50% 55%, black, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 55% 18%, black, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 60% 70%, black, rgba(0,0,0,0)),
            radial-gradient(1.5px 1.5px at 65% 38%, black, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 70% 12%, black, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 75% 62%, black, rgba(0,0,0,0)),
            radial-gradient(1.5px 1.5px at 80% 45%, black, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 85% 78%, black, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 90% 32%, black, rgba(0,0,0,0)),
            radial-gradient(1.5px 1.5px at 95% 58%, black, rgba(0,0,0,0)),
            radial-gradient(1px 1px at 98% 22%, black, rgba(0,0,0,0))
          `,
          backgroundSize: "200% 100%",
          backgroundPosition: "-100% 0",
          opacity: 0.35,
          animation: "scrollStars 25s linear infinite",
        }}
        aria-hidden="true"
      >
        <style>{`
          @keyframes scrollStars {
            0% {
              background-position: -100% 0;
            }
            100% {
              background-position: 100% 0;
            }
          }
        `}</style>
      </div>
      {/* Dense black star-field reveal overlay - Top to Bottom */}
      <svg
        className="pointer-events-none absolute inset-0 animate-star-field-reveal"
        viewBox="0 0 1200 600"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
        style={{
          width: "100%",
          height: "100%",
          top: 0,
          left: 0,
        }}
      >
        {generateStarField(1200, 600)}
      </svg>
      <Container className="relative grid gap-12 py-14 md:grid-cols-[1.55fr_0.72fr_0.72fr_1fr] md:gap-10 md:py-20">
        <ScrollAnimatedElement animation="fade-in" duration={600}>
          <div className="max-w-[28rem] text-left">
            <BrandLogo />
            <p className="mt-5 text-left text-[15px] font-normal leading-[1.55] text-[#636363]">
              <span className="block">A symbolic map of Thailand. Choose a fragment, claim</span>
              <span className="block">your certificate, make it part of your story.</span>
            </p>
          </div>
        </ScrollAnimatedElement>

        <ScrollAnimatedElement animation="slide-in-up" duration={600} delay={100}>
          <div>
            <p className="mb-6 text-[17px] font-semibold text-navy">Company</p>
            <ul className="space-y-3 text-left text-[15px] text-[#636363]">
              <li>
                <FooterLink href="/#how-it-works">Journal</FooterLink>
              </li>
              <li>
                <FooterLink href="/#map">Map</FooterLink>
              </li>
              <li>
                <FooterLink href="/#certificate">Certificate</FooterLink>
              </li>
              <li>
                <FooterLink href="/faq">FAQ</FooterLink>
              </li>
              <li>
                <FooterLink href="/contact">Contact</FooterLink>
              </li>
            </ul>
          </div>
        </ScrollAnimatedElement>

        <ScrollAnimatedElement animation="slide-in-up" duration={600} delay={200}>
          <div>
            <p className="mb-6 text-[17px] font-semibold text-navy">Legal</p>
            <ul className="space-y-3 text-left text-[15px] text-[#636363]">
              <li>
                <FooterLink href={routes.privacy}>Privacy Policy</FooterLink>
              </li>
              <li>
                <FooterLink href={routes.terms}>Terms and Conditions</FooterLink>
              </li>
              <li>
                <FooterText>Risk Disclosure</FooterText>
              </li>
              <li>
                <FooterText>Cookie Policy</FooterText>
              </li>
            </ul>
          </div>
        </ScrollAnimatedElement>

        <ScrollAnimatedElement animation="slide-in-up" duration={600} delay={300}>
          <div>
            <p className="mb-6 text-[17px] font-semibold text-navy">Contact us</p>
            <ul className="space-y-4 text-left text-[15px] text-[#636363]">
              <li className="flex items-start gap-3">
                <MailIcon />
                <span>contact@company.com</span>
              </li>
              <li className="flex items-start gap-3">
                <PhoneIcon />
                <span>(414) 687 - 5892</span>
              </li>
              <li className="flex items-start gap-3">
                <LocationIcon />
                <span>
                  794 Mcallister St
                  <br />
                  San Francisco, 94102
                </span>
              </li>
            </ul>
          </div>
        </ScrollAnimatedElement>
      </Container>
    </footer>
  );
}
