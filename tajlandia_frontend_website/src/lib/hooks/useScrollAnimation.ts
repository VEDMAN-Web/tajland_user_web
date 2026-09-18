import { useEffect, useRef, useState } from 'react';

export type AnimationType = 'fade-in' | 'slide-in-up' | 'slide-in-left' | 'slide-in-right' | 'scale-in' | 'fade-in-scale';

export interface ScrollAnimationConfig {
  type: AnimationType;
  duration?: number;
  delay?: number;
  threshold?: number;
  rootMargin?: string;
}

const animationClasses: Record<AnimationType, string> = {
  'fade-in': 'animate-fade-in',
  'slide-in-up': 'animate-slide-in-up',
  'slide-in-left': 'animate-slide-in-left',
  'slide-in-right': 'animate-slide-in-right',
  'scale-in': 'animate-scale-in',
  'fade-in-scale': 'animate-fade-in-scale',
};

export function useScrollAnimation(config: ScrollAnimationConfig) {
  const ref = useRef<HTMLElement>(null);
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
        threshold: config.threshold ?? 0.1,
        rootMargin: config.rootMargin ?? '0px',
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
  }, [config.threshold, config.rootMargin, hasAnimated]);

  const animationStyle = isVisible
    ? {
        animation: `${animationClasses[config.type].replace('animate-', '')} ${config.duration ?? 600}ms ease-out ${config.delay ?? 0}ms forwards`,
      }
    : { opacity: 0 };

  return { ref, isVisible, animationStyle };
}
