'use client';

import Link from "next/link";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Container } from "@/components/ui/Container";
import { ScrollAnimatedElement } from "@/components/animations/ScrollAnimatedElement";
import { brand } from "@/lib/constants/brand";

function MailIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-brand-red"><path d="M3 5.5h18v13H3zM4.8 7l7.2 5.2L19.2 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>;
}

function PhoneIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-brand-red"><path d="M7.4 3.5 10 3l2 4.5-2.1 1.7c.8 1.8 2.1 3.1 3.9 3.9l1.7-2.1L20 13l-.5 2.6c-.3 1.5-1.6 2.5-3.1 2.4-6.6-.5-11.9-5.8-12.4-12.4-.1-1.5.9-2.8 2.4-3.1Z" /></svg>;
}

function LocationIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-brand-red"><path d="M12 2.8a6.2 6.2 0 0 0-6.2 6.2c0 4.6 6.2 12.2 6.2 12.2s6.2-7.6 6.2-12.2A6.2 6.2 0 0 0 12 2.8Zm0 8.8a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z" /></svg>;
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="transition-colors hover:text-navy">{children}</Link>;
}

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden bg-[#fbfcfd] text-[#74777d]">
      <div className="pointer-events-none absolute inset-0 opacity-60 gradient-footer-bg" aria-hidden="true" />
      <Container className="relative grid gap-12 py-14 md:grid-cols-[1.55fr_0.72fr_0.72fr_1fr] md:gap-10 md:py-20">
        <ScrollAnimatedElement animation="fade-in" duration={600}>
          <div className="max-w-[330px]">
            <BrandLogo compact />
            <p className="mt-6 text-[15px] leading-6">A symbolic map of Thailand. Choose a fragment, claim your certificate, make it a part of your story.</p>
          </div>
        </ScrollAnimatedElement>

        <ScrollAnimatedElement animation="slide-in-up" duration={600} delay={100}>
          <div>
            <p className="mb-6 text-[17px] font-semibold text-navy">Company</p>
            <ul className="space-y-3 text-[15px]">
              <li><FooterLink href="/#how-it-works">Journal</FooterLink></li>
              <li><FooterLink href="/#map">Map</FooterLink></li>
              <li><FooterLink href="/#certificate">Certificate</FooterLink></li>
              <li>FAQ</li>
              <li><FooterLink href="/contact">Contact</FooterLink></li>
            </ul>
          </div>
        </ScrollAnimatedElement>

        <ScrollAnimatedElement animation="slide-in-up" duration={600} delay={200}>
          <div>
            <p className="mb-6 text-[17px] font-semibold text-navy">Legal</p>
            <ul className="space-y-3 text-[15px]">
              <li>Privacy Policy</li>
              <li>Terms of Service</li>
              <li>Risk Disclosure</li>
              <li>Cookie Policy</li>
            </ul>
          </div>
        </ScrollAnimatedElement>

        <ScrollAnimatedElement animation="slide-in-up" duration={600} delay={300}>
          <div>
            <p className="mb-6 text-[17px] font-semibold text-navy">Contacts us</p>
            <ul className="space-y-4 text-[15px]">
              <li className="flex items-start gap-3"><MailIcon /><span>contact@company.com</span></li>
              <li className="flex items-start gap-3"><PhoneIcon /><span>(414) 687 - 5892</span></li>
              <li className="flex items-start gap-3"><LocationIcon /><span>794 Mcallister St<br />San Francisco, 94102</span></li>
            </ul>
          </div>
        </ScrollAnimatedElement>
      </Container>

      <ScrollAnimatedElement animation="fade-in" duration={600}>
        <div className="relative border-t border-line/80">
          <Container className="flex flex-col gap-3 py-5 text-[14px] sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 {brand.name}.pl — Symbolic ownership only. Not real estate, not an investment, not cryptocurrency.</p>
            <p>Made with care, from Thailand.</p>
          </Container>
        </div>
      </ScrollAnimatedElement>
    </footer>
  );
}
