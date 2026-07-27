/**
 * Templates are plain text with `{{token}}` placeholders that get filled in
 * from a submission. Everything here runs on the client too, so the editor can
 * preview a template without a round trip.
 */

import type { Submission } from './db';
import { normalizeInstagram, toHttpUrl } from './normalize';

export interface Placeholder {
  token: string;
  label: string;
  value: (sub: Submission) => string;
}

export const PLACEHOLDERS: Placeholder[] = [
  { token: 'first_name', label: 'First name', value: (s) => s.name.trim().split(/\s+/)[0] ?? '' },
  { token: 'name', label: 'Full name', value: (s) => s.name },
  { token: 'email', label: 'Email', value: (s) => s.email ?? '' },
  {
    token: 'instagram',
    label: 'Instagram',
    value: (s) => {
      const handle = normalizeInstagram(s.instagram);
      return handle ? `@${handle}` : '';
    },
  },
  { token: 'location', label: 'Location', value: (s) => s.location ?? '' },
  { token: 'availability', label: 'Dates they picked', value: (s) => s.availability },
  { token: 'video', label: 'Video link', value: (s) => toHttpUrl(s.video_url) ?? s.video_url ?? '' },
  { token: 'status', label: 'Current status', value: (s) => s.status },
  { token: 'ref', label: 'Reference number', value: (s) => `#${s.id}` },
];

/** Whitespace inside the braces is tolerated: `{{ first_name }}` also works. */
const TOKEN_PATTERN = /\{\{\s*([a-z_]+)\s*\}\}/gi;

export interface RenderedTemplate {
  text: string;
  /** Known placeholders this comedian has no value for — left blank. */
  blank: string[];
  /** Tokens that aren't placeholders at all — left as typed, likely a typo. */
  unknown: string[];
}

export function renderTemplate(text: string, sub: Submission): RenderedTemplate {
  const blank = new Set<string>();
  const unknown = new Set<string>();

  const filled = text.replace(TOKEN_PATTERN, (match, rawToken: string) => {
    const token = rawToken.toLowerCase();
    const placeholder = PLACEHOLDERS.find((p) => p.token === token);
    if (!placeholder) {
      unknown.add(match);
      return match;
    }
    const value = placeholder.value(sub).trim();
    if (!value) {
      blank.add(`{{${token}}}`);
      return '';
    }
    return value;
  });

  return { text: filled, blank: [...blank], unknown: [...unknown] };
}

/**
 * Stand-in comedian for previewing before anyone has applied — and for
 * checking a template without picking a real person out of the list.
 */
export const SAMPLE_SUBMISSION: Submission = {
  id: 0,
  name: 'Sam Example',
  email: 'sam@example.com',
  instagram: 'sam.example',
  location: 'Glasgow',
  availability: '6 Aug, 9 Aug',
  video_url: 'https://youtube.com/watch?v=example',
  headshot_url: null,
  source: 'web',
  status: 'new',
  admin_notes: null,
  agreed_bring_two: true,
  has_tattoos: true,
  multiple_shows: true,
  questions: null,
  submitted_at: new Date(0).toISOString(),
};

/**
 * A mailto: link for the rendered template.
 *
 * Mail clients cap the URL length — Outlook around 2000 characters — so long
 * bodies can arrive truncated. The editor warns and offers copy-to-clipboard
 * instead rather than silently losing the end of the email.
 */
export const MAILTO_SAFE_LENGTH = 1800;

export function mailtoLink(to: string, subject: string, body: string): string {
  const params = new URLSearchParams({ subject, body });
  // URLSearchParams uses "+" for spaces; mail clients want %20.
  return `mailto:${encodeURIComponent(to)}?${params.toString().replace(/\+/g, '%20')}`;
}

/** Starting points offered when there are no templates yet. */
export const STARTER_TEMPLATES: { name: string; subject: string; body: string }[] = [
  {
    name: "You're booked",
    subject: 'Pins & Needles — you’re in!',
    body: `Hi {{first_name}},

Great news — we'd love to have you on Pins & Needles at the Edinburgh Fringe.

You're pencilled in for {{availability}} at The Raging Bull, 22:15. Doors are at 22:00, and you'll have a ten minute set.

Just reply to confirm you're still good for those dates and I'll send over the details.

Cheers,
Pins & Needles`,
  },
  {
    name: 'Thanks, but not this time',
    subject: 'Pins & Needles — thanks for applying',
    body: `Hi {{first_name}},

Thanks for sending your tape over for Pins & Needles — we watched it and really appreciate you applying.

We've filled the run this year, so it's a no from us this time. Please do send something again next year; we'd like to see more.

All the best,
Pins & Needles`,
  },
  {
    name: 'Asking for more info',
    subject: 'Pins & Needles — a couple of questions',
    body: `Hi {{first_name}},

Thanks for applying to Pins & Needles — your submission ({{ref}}) is with us and we're working through the tapes.

Before we decide, could you let us know:
- Are you still free on {{availability}}?
- Do you have a longer clip we could watch?

Cheers,
Pins & Needles`,
  },
];
