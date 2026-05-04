'use client';

import { useState, useEffect, useRef } from 'react';

export function useReadingProgress(contentRef: React.RefObject<HTMLElement | null>): number {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const handleScroll = () => {
      if (rafRef.current) return;

      rafRef.current = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const totalHeight = el.scrollHeight;
        const viewportHeight = window.innerHeight;

        const scrolled = Math.max(0, -rect.top);
        const scrollable = totalHeight - viewportHeight;

        if (scrollable <= 0) {
          setProgress(100);
        } else {
          const pct = Math.min(100, Math.max(0, (scrolled / scrollable) * 100));
          setProgress(Math.round(pct));
        }

        rafRef.current = 0;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [contentRef]);

  return progress;
}
