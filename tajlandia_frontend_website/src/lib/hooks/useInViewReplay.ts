import { useEffect, useRef, useState } from 'react';

/**
 * `inView` turns on once `threshold` of the element is visible and off again
 * only when it has fully left the viewport, so entrance animations replay on
 * every visit without flickering at the edge.
 */
export function useInViewReplay<T extends HTMLElement>(threshold = 0.25) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) {
          return;
        }
        if (!entry.isIntersecting) {
          setInView(false);
        } else if (entry.intersectionRatio >= threshold) {
          setInView(true);
        }
      },
      { threshold: [0, threshold] }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}
