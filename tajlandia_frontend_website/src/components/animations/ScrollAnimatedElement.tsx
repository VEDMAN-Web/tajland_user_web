'use client';

import { useRef, useEffect, useState } from 'react';
import type { AnimationType } from '@/lib/hooks/useScrollAnimation';

interface ScrollAnimatedElementProps {
  children: React.ReactNode;
  animation: AnimationType;
  duration?: number;
  delay?: number;
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
  'slide-in-right-dark': 'slide-in-right-dark',};

export function ScrollAnimatedElement({
  children,
  animation,
  duration = 600,
  delay = 0,
  threshold = 0.1,
  className = '',
}: ScrollAnimatedElementProps) {
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

  const style = isVisible
    ? {
        // `both` keeps the element at its first keyframe (hidden) during `delay`.
        animation: `${animationKeyframes[animation]} ${duration}ms ease-out ${delay}ms both`,
      }
    : { opacity: 0 };

  return (
    <div ref={ref} style={style} className={className}>
      {children}
    </div>
  );
}
