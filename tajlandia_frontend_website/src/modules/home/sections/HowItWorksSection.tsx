'use client';

import { Container } from "@/components/ui/Container";
import { ScrollAnimatedElement } from "@/components/animations/ScrollAnimatedElement";
import type { HomePageContent } from "../types/home.types";
import { useEffect, useState } from "react";

const stepIcons: Record<string, string> = {
  discover: "/images/home/how-it-works/discover.svg",
  explore: "/images/home/how-it-works/explore.svg",
  connect: "/images/home/how-it-works/claim.svg",
  secure: "/images/home/how-it-works/certificate.svg",
};

function StepIcon({ name }: { name: string }) {
  const src = stepIcons[name] ?? stepIcons.discover;

  return (
    <span
      aria-hidden="true"
      className="block h-[22px] w-[22px] bg-current"
      style={{
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskSize: "contain",
        maskSize: "contain",
      }}
    />
  );
}

type HowItWorksSectionProps = {
  content: HomePageContent["howItWorks"];
};

export function HowItWorksSection({ content }: HowItWorksSectionProps) {
  const stepLabels = ["EXPLORE", "CHOOSE", "CLAIM", "CERTIFICATE"];
  const [activeStep, setActiveStep] = useState(0);
  const [lineProgress, setLineProgress] = useState(0);
  const [lineInstant, setLineInstant] = useState(true);

  useEffect(() => {
    const count = content.steps.length;
    if (count < 2) {
      return;
    }

    let step = 0;
    let phase: "draw" | "activate" | "reset" = "draw";
    const release = window.setTimeout(() => setLineInstant(false), 40);
    const id = window.setInterval(() => {
      const next = (step + 1) % count;

      if (phase === "draw") {
        if (next === 0) {
          phase = "reset";
          return;
        }
        setLineProgress(next / (count - 1));
        phase = "activate";
        return;
      }

      if (phase === "activate") {
        step = next;
        setActiveStep(step);
        phase = "draw";
        return;
      }

      setLineInstant(true);
      setLineProgress(0);
      setActiveStep(0);
      step = 0;
      phase = "draw";
      window.setTimeout(() => setLineInstant(false), 40);
    }, 1000);

    return () => {
      window.clearTimeout(release);
      window.clearInterval(id);
    };
  }, [content.steps.length]);

  if (content.steps.length === 0) {
    return null;
  }

  const worksAccent = "Works";
  const worksIndex = content.heading.lastIndexOf(worksAccent);
  const headingLead = worksIndex > 0 ? content.heading.slice(0, worksIndex).trimEnd() : content.heading;
  const headingAccent = worksIndex > 0 ? content.heading.slice(worksIndex) : "";

  return (
    <section id="how-it-works" className="bg-white pb-[60px] pt-1 lg:pb-[80px] lg:pt-2">
      <Container>
        <ScrollAnimatedElement animation="fade-in" duration={700} threshold={0.1}>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-[family-name:var(--font-playfair-display)] text-[40px] font-semibold leading-[1.05] tracking-[-0.03em] text-navy sm:text-[48px]">
              {headingLead}
              {headingAccent ? (
                <>
                  {" "}
                  <span className="italic text-brand-red">{headingAccent}</span>
                </>
              ) : null}
            </h2>
            <p className="mx-auto mt-3 max-w-[34rem] font-[family-name:var(--font-manrope)] text-[16px] font-normal leading-[1.5] text-[#8a99aa] sm:text-[17px]">
              A seamless process to acquire and showcase
              <br />
              your digital collectible.
            </p>
          </div>
        </ScrollAnimatedElement>

        <ol className="relative mt-12 grid list-none gap-10 p-0 sm:grid-cols-2 lg:mt-14 lg:grid-cols-4 lg:gap-8">
          <div
            className="pointer-events-none absolute left-[12.5%] right-[12.5%] top-7 hidden h-[3px] -translate-y-1/2 overflow-visible rounded-full bg-[#f3d6d6] lg:block"
            aria-hidden="true"
          >
            <div
              className={`relative h-full rounded-full bg-brand-red shadow-[0_0_12px_rgba(200,30,30,0.55)] ${lineInstant ? "transition-none" : "transition-[width] duration-1000 ease-in-out"}`}
              style={{ width: `${lineProgress * 100}%` }}
            >
              <span
                className={`absolute inset-y-[-1px] right-0 w-10 rounded-full bg-gradient-to-r from-transparent via-white/70 to-white ${lineProgress > 0 ? "opacity-100" : "opacity-0"}`}
              />
              {lineProgress > 0 ? (
                <span className="absolute top-1/2 right-0 h-2.5 w-2.5 -translate-y-1/2 translate-x-1/2 rounded-full bg-white shadow-[0_0_0_3px_#c81e1e,0_0_14px_4px_rgba(200,30,30,0.65)]" />
              ) : null}
            </div>
          </div>
          {content.steps.map((step, index) => (
            <li key={step.id} className="relative z-10 min-w-0 text-center">
              <div className="relative mx-auto inline-flex">
                <div
                  className={`relative mx-auto flex h-14 w-14 items-center justify-center rounded-full ${
                    activeStep === index
                      ? "bg-navy text-white"
                      : "bg-white text-navy shadow-[inset_0_0_0_1.5px_#d9e1ec]"
                  }`}
                >
                  <StepIcon name={step.icon} />
                </div>
              </div>
              <p className="mt-4 text-[11px] font-semibold tracking-[0.14em] text-brand-red">
                {String(index + 1).padStart(2, "0")} {stepLabels[index] ?? step.id.toUpperCase()}
              </p>
              <h3 className="mt-2 text-[16px] font-semibold leading-snug tracking-[-0.02em] text-navy">
                {step.title}
              </h3>
              <p className="mx-auto mt-2 max-w-[200px] text-[13px] leading-[1.45] text-[#8a99aa]">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
