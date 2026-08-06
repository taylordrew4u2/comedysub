'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Fades its children up as they scroll into view.
 *
 * The hidden state is applied from an effect rather than in the markup, so a
 * visitor without JavaScript — or one who arrives mid-page — sees the content
 * immediately instead of a permanently blank section.
 */
export default function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [armed, setArmed] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setArmed(true);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShown(true);
        observer.disconnect();
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.05 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={[armed && !shown ? 'reveal-ready' : '', shown ? 'reveal-in' : '', className]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}
