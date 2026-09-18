'use client';

import { useRef, useEffect, useState, Children } from 'react';
import type { AnimationType } from '@/lib/hooks/useScrollAnimation';

interface ScrollStaggeredElementsProps {
  children: React.ReactNode;
  animation: AnimationType;
  staggerDelay?: number;
  duration?: number;
  threshold?: number;
  className?: string;
}

const animationKeyframes: Record<AnimationType, string> = {
  'fade-in': 'fade-in',
  'slide-in-up': 'slide-in-up',
  'slide-in-left': 'slide-in-left',
  'slide-in-right': 'slide-in-right',
  'scale-in': 'scale-in',
  'fade-in-scale': 'fade-in-scale',
  'slide-in-right-dark': 'slide-in-right-dark',
};

export function ScrollStaggeredElements({
  children,
  animation,
  staggerDelay = 100,
  duration = 600,
  threshold = 0.1,
  className = '',
}: ScrollStaggeredElementsProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]!;
        if (entry && entry.isIntersecting && !hasAnimated) {
          setIsVisible(true);
          setHasAnimated(true);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [threshold, hasAnimated]);

  const childArray = Children.toArray(children);

  return (
    <div ref={ref} className={className}>
      {childArray.map((child, index) => {
        const style = isVisible
          ? {
              animation: `${animationKeyframes[animation]} ${duration}ms ease-out ${index * staggerDelay}ms forwards`,
            }
          : { opacity: 0 };

        return (
          <div key={index} style={style}>
            {child}
          </div>
        );
      })}
    </div>
  );
}
