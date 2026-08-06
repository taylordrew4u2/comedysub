/**
 * The TLC mark: three butterflies rising away from the lettering.
 *
 * Drawn rather than shipped as an image file so it stays crisp at any size,
 * inherits the palette, and lets the admin change the letters and the tagline
 * without re-exporting anything. Everything scales from the container's own
 * font-size, so one `text-[17px]` sets the whole lockup.
 */

interface LogoProps {
  mark: string;
  tagline: string;
  /** Light sits on the green/photo backdrops; dark sits on cream. */
  tone?: 'light' | 'dark';
  className?: string;
}

/**
 * One butterfly: two broad upper wings, two smaller lower ones, and a thin
 * body that runs past them at both ends. Mirrored pairs rather than one
 * flipped group, so the shape stays symmetrical at any scale.
 */
function Butterfly({ x, y, size }: { x: number; y: number; size: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${size})`}>
      <path d="M-1.5-9 C-7-19 -17-18 -18-9 C-19 0 -10 4 -2 0 Z" />
      <path d="M1.5-9 C7-19 17-18 18-9 C19 0 10 4 2 0 Z" />
      <path d="M-1.5 1 C-8 2 -12 8 -9 14 C-6 19 -1 16 -1.5 9 Z" />
      <path d="M1.5 1 C8 2 12 8 9 14 C6 19 1 16 1.5 9 Z" />
      <rect x="-0.6" y="-13" width="1.2" height="29" rx="0.6" fill="var(--logo-body)" />
    </g>
  );
}

export default function Logo({ mark, tagline, tone = 'dark', className }: LogoProps) {
  const ink = tone === 'light' ? '#F7F3E8' : 'var(--green-deep)';

  return (
    <span
      className={`inline-flex flex-col items-center leading-none ${className ?? ''}`}
      style={
        {
          '--logo-body': tone === 'light' ? 'rgba(20,28,18,0.5)' : 'var(--green-deep)',
        } as React.CSSProperties
      }
    >
      <svg
        viewBox="0 0 176 76"
        role="img"
        aria-hidden="true"
        className="h-[2.4em] w-auto"
        fill="var(--gold)"
      >
        <Butterfly x={26} y={57} size={0.55} />
        <Butterfly x={80} y={38} size={0.8} />
        <Butterfly x={142} y={20} size={1} />
      </svg>

      <span className="mt-[0.05em] flex items-center">
        {/* The open swash that curls around the first letter of the mark. */}
        <svg
          viewBox="0 0 24 52"
          aria-hidden="true"
          className="mr-[-0.18em] h-[1.55em] w-auto"
          fill="none"
          stroke="var(--gold)"
          strokeWidth="1.9"
          strokeLinecap="round"
        >
          <path d="M21 4C10 9 3 18.5 3 26.5S10 44 21 49" />
        </svg>
        <span
          className="font-serif text-[1.7em] tracking-[0.02em]"
          style={{ color: ink }}
        >
          {mark}
        </span>
      </span>

      {tagline ? (
        <span
          className="mt-[0.55em] text-[0.5em] font-light uppercase tracking-[0.4em] indent-[0.4em]"
          style={{ color: tone === 'light' ? 'rgba(247,243,232,0.9)' : 'var(--gold-deep)' }}
        >
          {tagline}
        </span>
      ) : null}
    </span>
  );
}
