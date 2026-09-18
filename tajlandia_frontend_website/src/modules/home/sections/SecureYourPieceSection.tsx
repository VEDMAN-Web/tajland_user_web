'use client';

import { useEffect, useRef, useState } from 'react';
import { Container } from '@/components/ui/Container';
import { ScrollAnimatedElement } from '@/components/animations/ScrollAnimatedElement';

type SecureItem = {
  id: string;
  icon: string;
  title: string;
  description: string;
};

const secureItems: SecureItem[] = [
  {
    id: 'verify',
    icon: '✓',
    title: 'Verify Authenticity',
    description: 'Blockchain-backed proof of ownership',
  },
  {
    id: 'protect',
    icon: '🛡',
    title: 'Protect Your Asset',
    description: 'Secure digital collectible storage',
  },
  {
    id: 'trade',
    icon: '💎',
    title: 'Trade with Confidence',
    description: 'Transparent marketplace transactions',
  },
];

export function SecureYourPieceSection() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
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

    // Initially show all 3 items
    setActiveIndex(null);

    // Then start cycling through them
    const timer = setTimeout(() => {
      let currentIndex = 0;

      const interval = setInterval(() => {
        setActiveIndex(currentIndex);
        currentIndex = (currentIndex + 1) % secureItems.length;
      }, 1500);

      return () => clearInterval(interval);
    }, 1000);

    return () => clearTimeout(timer);
  }, [autoPlay]);

  const handleItemHover = (index: number) => {
    setAutoPlay(false);
    setActiveIndex(index);
  };

  const handleItemLeave = () => {
    setAutoPlay(true);
  };

  return (
    <section
      ref={sectionRef}
      className="bg-gradient-to-b from-white via-[#f8fafb] to-white py-[60px] lg:py-[80px]"
    >
      <Container>
        <ScrollAnimatedElement
          animation="fade-in"
          duration={700}
          threshold={0.1}
          className="mb-16 text-center"
        >
          <div className="mx-auto max-w-2xl">
            <p className="font-display text-[15px] font-medium text-brand-red">
              SECURITY FEATURES
            </p>
            <h2 className="mt-3 font-display text-[39px] leading-none tracking-[-0.04em] text-navy sm:text-[45px]">
              Secure Your <span className="italic text-brand-red">Piece</span>
            </h2>
            <p className="mx-auto mt-4 max-w-[430px] text-[17px] leading-5 text-[#8a99aa]">
              Every digital collectible is protected with blockchain technology
            </p>
          </div>
        </ScrollAnimatedElement>

        <div className="mx-auto max-w-5xl">
          <div className="grid gap-8 sm:grid-cols-3">
            {secureItems.map((item, index) => (
              <ScrollAnimatedElement
                key={item.id}
                animation="scale-in"
                duration={600}
                delay={index * 100}
                threshold={0.1}
              >
                <div
                  onMouseEnter={() => handleItemHover(index)}
                  onMouseLeave={handleItemLeave}
                  className={`group relative cursor-pointer rounded-2xl transition-all duration-500 ${
                    activeIndex === index
                      ? 'bg-gradient-to-br from-brand-red/10 to-brand-red/5 scale-105 shadow-lg'
                      : activeIndex === null
                        ? 'bg-gradient-to-br from-[#f0f4f9] to-[#e6ecf5] hover:from-[#e6ecf5] hover:to-[#dfe7ef]'
                        : 'bg-[#f8fafb] opacity-60'
                  } p-8 text-center`}
                >
                  {/* Highlight indicator for active item */}
                  {activeIndex === index && (
                    <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-brand-red to-orange-500 opacity-20 blur-md animate-pulse-soft" />
                  )}

                  <div className="relative z-10 space-y-4">
                    {/* Icon */}
                    <div
                      className={`mx-auto inline-flex transition-all duration-500 ${
                        activeIndex === index
                          ? 'scale-125 text-brand-red'
                          : 'scale-100 text-navy'
                      }`}
                    >
                      <div className="text-5xl font-display">{item.icon}</div>
                    </div>

                    {/* Number indicator */}
                    <div className={`text-sm font-semibold transition-all duration-500 ${
                      activeIndex === index ? 'text-brand-red' : 'text-[#8a99aa]'
                    }`}>
                      0{index + 1}
                    </div>

                    {/* Title */}
                    <h3 className={`text-lg font-semibold tracking-[-0.02em] transition-all duration-500 ${
                      activeIndex === index ? 'text-navy' : 'text-navy'
                    }`}>
                      {item.title}
                    </h3>

                    {/* Description */}
                    <p className={`text-sm leading-5 transition-all duration-500 ${
                      activeIndex === index ? 'text-foreground' : 'text-[#8a99aa]'
                    }`}>
                      {item.description}
                    </p>

                    {/* Bottom accent line */}
                    <div className={`h-1 w-12 mx-auto rounded-full transition-all duration-500 ${
                      activeIndex === index ? 'bg-brand-red' : 'bg-[#dfe7ef]'
                    }`} />
                  </div>
                </div>
              </ScrollAnimatedElement>
            ))}
          </div>

          {/* Progress dots */}
          <div className="mt-12 flex justify-center gap-3">
            {secureItems.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setAutoPlay(false);
                  setActiveIndex(index);
                }}
                className={`h-2.5 rounded-full transition-all duration-500 ${
                  activeIndex === index
                    ? 'w-8 bg-brand-red'
                    : 'w-2.5 bg-[#dfe7ef] hover:bg-[#c4d1e0]'
                }`}
                aria-label={`Go to item ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
