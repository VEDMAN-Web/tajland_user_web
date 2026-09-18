'use client';

import { Container } from "@/components/ui/Container";
import { ScrollAnimatedElement } from "@/components/animations/ScrollAnimatedElement";
import Image from "next/image";
import type { HomePageContent } from "../types/home.types";
import { useEffect, useRef, useState } from "react";

const iconMap: Record<string, string> = {
  discover: '/images/home/how-it-works/discover.png',
  explore: '/images/home/how-it-works/explore.png',
  connect: '/images/home/how-it-works/claim.png',
  secure: '/images/home/how-it-works/ic_secure.svg',
};

type HowItWorksSectionProps = {
  content: HomePageContent["howItWorks"];
};

export function HowItWorksSection({ content }: HowItWorksSectionProps) {
  if (content.steps.length === 0) {
    return null;
  }

  const stepLabels = ["EXPLORE", "CHOOSE", "CLAIM", "CERTIFICATE"];
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [autoPlay, setAutoPlay] = useState(true);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setAutoPlay(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!autoPlay) return;

    let currentIndex = 0;
    const interval = setInterval(() => {
      setActiveStep(currentIndex);
      currentIndex = (currentIndex + 1) % content.steps.length;
    }, 1200);

    return () => clearInterval(interval);
  }, [autoPlay, content.steps.length]);

  const handleStepHover = (index: number) => {
    setAutoPlay(false);
    setActiveStep(index);
  };

  const handleStepLeave = () => {
    setAutoPlay(true);
  };

  return (
    <section ref={sectionRef} id="how-it-works" className="bg-white py-[60px] lg:py-[80px]">
      <Container>
        <ScrollAnimatedElement animation="fade-in" duration={700} threshold={0.1}>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-[39px] leading-none tracking-[-0.04em] text-navy sm:text-[45px]">
              How It <span className="italic text-brand-red">Works</span>
            </h2>
            <p className="mx-auto mt-3 max-w-[430px] text-[17px] leading-5 text-[#8a99aa]">
              A seamless process to acquire and showcase
              <br className="hidden sm:block" /> your digital collectible.
            </p>
          </div>
        </ScrollAnimatedElement>

        <ol className="relative mt-14 grid list-none gap-10 p-0 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4 lg:gap-6 before:hidden lg:before:absolute lg:before:left-[12.5%] lg:before:right-[12.5%] lg:before:top-[30px] lg:before:block lg:before:h-px lg:before:bg-gradient-to-r lg:before:from-transparent lg:before:via-[#dfe7ef] lg:before:to-transparent">
          {content.steps.map((step, index) => (
            <ScrollAnimatedElement
              key={step.id}
              animation="scale-in"
              duration={600}
              delay={index * 100}
              className="relative z-10 min-w-0"
            >
              <div
                onMouseEnter={() => handleStepHover(index)}
                onMouseLeave={handleStepLeave}
                className="group cursor-pointer text-center transition-all duration-500"
              >
                {/* Icon Container */}
                <div className="relative mx-auto inline-flex">
                  {/* Bounce animation for active step */}
                  {activeStep === index && (
                    <div className="absolute inset-0 animate-bounce rounded-full bg-brand-red/20" />
                  )}

                  {/* Icon Background - Dark blue when active, Light otherwise */}
                  <div
                    className={`relative mx-auto flex h-[60px] w-[60px] items-center justify-center rounded-full transition-all duration-500 overflow-hidden shadow-lg ${
                      activeStep === index
                        ? 'scale-110 !bg-[#001F54]'
                        : 'bg-gradient-to-br from-[#f0f4f9] to-[#e6ecf5] group-hover:from-[#e6ecf5] group-hover:to-[#dfe7ef]'
                    }`}
                  >
                    <Image
                      src={iconMap[step.icon] || '/images/home/how-it-works/discover.png'}
                      alt={step.title}
                      width={52}
                      height={52}
                      className="h-auto w-auto"
                    />
                  </div>
                </div>

                {/* Step Number & Label */}
                <p
                  className={`mt-6 text-[10px] font-medium transition-all duration-500 ${
                    activeStep === index ? 'text-brand-red scale-105' : 'text-brand-red'
                  }`}
                >
                  {String(index + 1).padStart(2, "0")} {stepLabels[index] ?? step.id.toUpperCase()}
                </p>

                {/* Title */}
                <h3
                  className={`mt-2 text-[17px] font-semibold tracking-[-0.02em] transition-all duration-500 ${
                    activeStep === index ? 'text-navy' : 'text-navy'
                  }`}
                >
                  {step.title}
                </h3>

                {/* Description */}
                <p
                  className={`mx-auto mt-2 max-w-[220px] text-[13px] leading-5 transition-all duration-500 ${
                    activeStep === index ? 'text-foreground font-medium' : 'text-[#8a99aa]'
                  }`}
                >
                  {step.description}
                </p>

                {/* Highlight indicator */}
                {activeStep === index && (
                  <div className="mt-4 h-1 w-12 mx-auto rounded-full bg-brand-red" />
                )}
              </div>
            </ScrollAnimatedElement>
          ))}
        </ol>

        {/* Progress indicators */}
        <div className="mt-12 flex justify-center gap-2">
          {content.steps.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setAutoPlay(false);
                setActiveStep(index);
              }}
              className={`h-2 rounded-full transition-all duration-500 ${
                activeStep === index ? 'w-8 bg-brand-red' : 'w-2 bg-[#dfe7ef] hover:bg-[#c4d1e0]'
              }`}
              aria-label={`Go to step ${index + 1}`}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
