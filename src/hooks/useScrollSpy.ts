'use client';

import { useState, useEffect, useRef } from 'react';
import { TocHeading } from '@/lib/markdown-utils';

export function useScrollSpy(headings: TocHeading[]): string | null {
  const [activeId, setActiveId] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (headings.length === 0) return;

    observerRef.current?.disconnect();

    const headingElements = headings
      .map(h => document.getElementById(h.id))
      .filter(Boolean) as HTMLElement[];

    if (headingElements.length === 0) return;

    const visibleHeadings = new Set<string>();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            visibleHeadings.add(entry.target.id);
          } else {
            visibleHeadings.delete(entry.target.id);
          }
        });

        if (visibleHeadings.size > 0) {
          // Pick the topmost visible heading based on document order
          const topVisible = headings.find(h => visibleHeadings.has(h.id));
          if (topVisible) setActiveId(topVisible.id);
        }
      },
      {
        rootMargin: '-80px 0px -70% 0px',
        threshold: 0,
      }
    );

    headingElements.forEach(el => observerRef.current!.observe(el));

    return () => observerRef.current?.disconnect();
  }, [headings]);

  return activeId;
}
