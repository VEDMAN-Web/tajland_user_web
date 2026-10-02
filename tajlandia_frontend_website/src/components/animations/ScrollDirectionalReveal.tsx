'use client';

import { useEffect, useRef, useState } from 'react';

type RevealState = 'hidden' | 'from-left' | 'from-right';

interface ScrollDirectionalRevealProps {
  children: React.ReactNode;
  duration?: number;
  /** Delay (ms) when entering while scrolling down. */
  delay?: number;
  /** Delay (ms) when entering while scrolling up; defaults to `delay`. */
  reverseDelay?: number;
  easing?: string;
  threshold?: number;
  className?: string;
}

// One shared scroll listener tracks the page's last scroll direction. Reading
// the element's position on entry is not enough: a single wheel tick can bring
// a short element fully into view, which looks like "from below" either way.
let lastScrollY = 0;
let scrollingUp = false;
let subscribers = 0;

function trackScrollDirection() {
  const y = window.scrollY;
  if (y !== lastScrollY) {
    scrollingUp = y < lastScrollY;
    lastScrollY = y;
  }
}

function subscribeScrollDirection() {
  if (subscribers++ === 0) {
    lastScrollY = window.scrollY;
    scrollingUp = false;
    window.addEventListener('scroll', trackScrollDirection, { passive: true });
  }
  return () => {
    if (--subscribers === 0) {
      window.removeEventListener('scroll', trackScrollDirection);
    }
  };
}

/**
 * Replays a slide-in every time the element enters the viewport: from the
 * left while scrolling down, from the right while scrolling up. It hides again
 * once fully out of view so the next entry animates too.
 */
export function ScrollDirectionalReveal({
  children,
  duration = 900,
  delay = 0,
  reverseDelay = delay,
  easing = 'cubic-bezier(0.16, 1, 0.3, 1)',
  threshold = 0.1,
  className = '',
}: ScrollDirectionalRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<RevealState>('hidden');

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    const unsubscribe = subscribeScrollDirection();
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) {
          return;
        }
        if (!entry.isIntersecting) {
          setState('hidden');
          return;
        }
        if (entry.intersectionRatio >= threshold) {
          // Scroll events run before observer callbacks, so this is current.
          const next = scrollingUp ? 'from-right' : 'from-left';
          setState((current) => (current === 'hidden' ? next : current));
        }
      },
      { threshold: [0, threshold] }
    );

    observer.observe(element);
    return () => {
      observer.disconnect();
      unsubscribe();
    };
  }, [threshold]);

  const style =
    state === 'hidden'
      ? { opacity: 0 }
      : state === 'from-left'
        ? // `both` keeps the element at its first keyframe (hidden) during the delay.
          { animation: `reveal-left ${duration}ms ${easing} ${delay}ms both` }
        : { animation: `reveal-right ${duration}ms ${easing} ${reverseDelay}ms both` };

  return (
    <div ref={ref} style={style} className={className} data-reveal={state}>
      {children}
    </div>
  );
}
