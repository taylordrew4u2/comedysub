/**
 * Every word on the public site lives here as an editable field.
 *
 * The admin's Content tab is rendered straight from `CONTENT_GROUPS`, and the
 * defaults below are what the site shows before anyone has edited anything —
 * so adding a field is a one-line change that appears in the editor, in the
 * seeded copy, and in the typed `SiteContent` map all at once.
 */

export type ContentFieldType = 'text' | 'textarea' | 'url' | 'toggle' | 'lines';

export interface ContentField {
  key: string;
  label: string;
  type: ContentFieldType;
  /** Shown under the input in the admin — say what the field does to the page. */
  help?: string;
  default: string;
}

export interface ContentGroup {
  id: string;
  title: string;
  description: string;
  fields: ContentField[];
}

export const CONTENT_GROUPS: ContentGroup[] = [
  {
    id: 'brand',
    title: 'Brand',
    description: 'The name in the header, the browser tab, and the footer.',
    fields: [
      {
        key: 'brand_name',
        label: 'Business name',
        type: 'text',
        default: 'TLC Massage Wellness',
      },
      {
        key: 'brand_mark',
        label: 'Logo lettering',
        type: 'text',
        help: 'The large letters inside the logo. Two or three letters look best.',
        default: 'TLC',
      },
      {
        key: 'brand_tagline',
        label: 'Logo tagline',
        type: 'text',
        help: 'The spaced-out words under the logo lettering.',
        default: 'Massage Wellness',
      },
      {
        key: 'meta_description',
        label: 'Search-engine description',
        type: 'text',
        default:
          'Complimentary massage and wellness treatments. Book a visit with TLC Massage Wellness and let us take care of the rest.',
      },
      {
        key: 'announcement',
        label: 'Announcement bar',
        type: 'text',
        help: 'A single line above the header. Leave empty to hide the bar.',
        default: 'Every treatment is complimentary — always.',
      },
    ],
  },
  {
    id: 'hero',
    title: 'Hero',
    description: 'The full-height opening panel.',
    fields: [
      {
        key: 'hero_eyebrow',
        label: 'Small line above the heading',
        type: 'text',
        default: 'Welcome to TLC',
      },
      {
        key: 'hero_heading',
        label: 'Heading',
        type: 'textarea',
        help: 'Put each line on its own line — they stack as written.',
        default: 'Relax\nyour body',
      },
      {
        key: 'hero_subheading',
        label: 'Sub-heading',
        type: 'textarea',
        default:
          'Unhurried massage and wellness therapy in a quiet room, given with care.\nEvery treatment we offer is free.',
      },
      {
        key: 'hero_cta_label',
        label: 'Button label',
        type: 'text',
        default: 'Book a visit',
      },
      {
        key: 'hero_image_url',
        label: 'Background photo',
        type: 'url',
        help: 'Paste a link to an image. Leave empty for the soft green backdrop.',
        default: '',
      },
    ],
  },
  {
    id: 'about',
    title: 'About us',
    description: 'The introduction under the hero.',
    fields: [
      {
        key: 'about_eyebrow',
        label: 'Small line above the heading',
        type: 'text',
        default: 'About us',
      },
      {
        key: 'about_title',
        label: 'Heading',
        type: 'text',
        default: 'Care, given gently',
      },
      {
        key: 'about_body',
        label: 'Body text',
        type: 'textarea',
        help: 'Leave a blank line between paragraphs.',
        default:
          'TLC Massage Wellness is a small, calm practice built around one idea: that looking after your body should never be a luxury.\n\nEvery treatment on our list is offered free of charge. There is nothing to pay when you arrive, nothing to pay when you leave, and no upsell in between — just an hour that belongs entirely to you.',
      },
      {
        key: 'about_points',
        label: 'Highlights',
        type: 'lines',
        help: 'One per line. They appear as a short list beside the text.',
        default:
          'Qualified, insured therapists\nEvery treatment free of charge\nQuiet, private treatment rooms\nStep-free access throughout',
      },
      {
        key: 'about_image_url',
        label: 'Photo',
        type: 'url',
        help: 'Optional. Leave empty for the leaf motif.',
        default: '',
      },
    ],
  },
  {
    id: 'services',
    title: 'Our offer',
    description: 'Wording around the treatment list. The treatments themselves live on the Treatments tab.',
    fields: [
      {
        key: 'services_eyebrow',
        label: 'Small line above the heading',
        type: 'text',
        default: 'Our offer',
      },
      {
        key: 'services_title',
        label: 'Heading',
        type: 'text',
        default: 'Treatments',
      },
      {
        key: 'services_intro',
        label: 'Intro text',
        type: 'textarea',
        default:
          'Choose the one that sounds like what your body is asking for — or tell us on the booking form and we will help you decide.',
      },
      {
        key: 'services_note',
        label: 'Note under the list',
        type: 'text',
        default: 'Every treatment listed here is complimentary. There is never anything to pay.',
      },
    ],
  },
  {
    id: 'team',
    title: 'Our team',
    description: 'Wording around the therapist profiles. The people themselves live on the Team tab.',
    fields: [
      {
        key: 'team_eyebrow',
        label: 'Small line above the heading',
        type: 'text',
        default: 'Our team',
      },
      {
        key: 'team_title',
        label: 'Heading',
        type: 'text',
        default: 'The hands you are in',
      },
      {
        key: 'team_intro',
        label: 'Intro text',
        type: 'textarea',
        default: 'A small team, so you will usually see the same face each visit.',
      },
    ],
  },
  {
    id: 'booking',
    title: 'Booking',
    description: 'The request form and what happens after it is sent.',
    fields: [
      {
        key: 'bookings_open',
        label: 'Accepting bookings',
        type: 'toggle',
        help: 'Turn this off to replace the form with a short notice.',
        default: 'true',
      },
      {
        key: 'booking_eyebrow',
        label: 'Small line above the heading',
        type: 'text',
        default: 'Book a visit',
      },
      {
        key: 'booking_title',
        label: 'Heading',
        type: 'text',
        default: 'Request an appointment',
      },
      {
        key: 'booking_intro',
        label: 'Intro text',
        type: 'textarea',
        default:
          'Tell us when suits you and we will confirm by email. Requests are not booked in until we reply.',
      },
      {
        key: 'booking_slots',
        label: 'Appointment times',
        type: 'lines',
        help: 'One per line. These are the times people can choose from.',
        default:
          '9:00 am\n10:30 am\n12:00 pm\n1:30 pm\n3:00 pm\n4:30 pm\n6:00 pm',
      },
      {
        key: 'booking_confirmation',
        label: 'Thank-you message',
        type: 'textarea',
        help: 'Shown once a request has been sent.',
        default:
          'Thank you — your request is with us. We will email you to confirm your appointment within one working day.',
      },
      {
        key: 'booking_closed_message',
        label: 'Message when bookings are off',
        type: 'textarea',
        default:
          'Our books are closed for the moment. Please check back soon, or get in touch and we will let you know as soon as they reopen.',
      },
    ],
  },
  {
    id: 'contact',
    title: 'Contact',
    description: 'Where you are and how to reach you.',
    fields: [
      {
        key: 'contact_eyebrow',
        label: 'Small line above the heading',
        type: 'text',
        default: 'Contact',
      },
      {
        key: 'contact_title',
        label: 'Heading',
        type: 'text',
        default: 'Come and see us',
      },
      {
        key: 'contact_address',
        label: 'Address',
        type: 'textarea',
        help: 'One line per line of the address.',
        default: 'TLC Massage Wellness\n12 Willow Lane\nEdinburgh EH1 1AA',
      },
      {
        key: 'contact_phone',
        label: 'Phone',
        type: 'text',
        default: '0131 496 0000',
      },
      {
        key: 'contact_email',
        label: 'Email',
        type: 'text',
        help: 'Booking requests are also emailed from here when you reply in the admin.',
        default: 'hello@tlcmassagewellness.com',
      },
      {
        key: 'contact_hours',
        label: 'Opening hours',
        type: 'lines',
        help: 'One line per day or group of days, e.g. "Mon – Fri  9am – 7pm".',
        default:
          'Monday – Friday   9am – 7pm\nSaturday   9am – 4pm\nSunday   Closed',
      },
      {
        key: 'contact_map_url',
        label: 'Directions link',
        type: 'url',
        help: 'Optional link to a map. Shown as a "Get directions" button.',
        default: '',
      },
    ],
  },
  {
    id: 'footer',
    title: 'Social & footer',
    description: 'Links at the bottom of every page.',
    fields: [
      {
        key: 'social_instagram',
        label: 'Instagram',
        type: 'text',
        help: 'A handle or a full profile link. Leave empty to hide.',
        default: '',
      },
      {
        key: 'social_facebook',
        label: 'Facebook',
        type: 'url',
        default: '',
      },
      {
        key: 'social_tiktok',
        label: 'TikTok',
        type: 'url',
        default: '',
      },
      {
        key: 'footer_note',
        label: 'Footer note',
        type: 'text',
        default: 'Complimentary massage and wellness therapy.',
      },
    ],
  },
];

export const CONTENT_FIELDS: ContentField[] = CONTENT_GROUPS.flatMap((g) => g.fields);

export type SiteContent = Record<string, string>;

export const DEFAULT_CONTENT: SiteContent = Object.fromEntries(
  CONTENT_FIELDS.map((f) => [f.key, f.default]),
);

export function isContentKey(key: unknown): key is string {
  return typeof key === 'string' && key in DEFAULT_CONTENT;
}

/**
 * Stored values layered over the defaults.
 *
 * An empty string is a deliberate "hide this" — clearing the announcement bar
 * should not bounce the default text back — so only *missing* keys fall back.
 */
export function withDefaults(stored: SiteContent): SiteContent {
  return { ...DEFAULT_CONTENT, ...stored };
}

/** Splits a `lines` field into its entries, dropping blanks. */
export function toLines(value: string | undefined): string[] {
  return (value ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

/** Splits a `textarea` field into paragraphs on blank lines. */
export function toParagraphs(value: string | undefined): string[] {
  return (value ?? '')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}
