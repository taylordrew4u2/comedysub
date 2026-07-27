/**
 * The form invites comedians to paste links "any way you like", so what
 * arrives is rarely a clean absolute URL. These helpers turn that input into
 * something safe to put in an href — and, just as importantly, tell the caller
 * when the input *isn't* a link so it can be rendered as plain text instead.
 */

const SCHEME = /^[a-z][a-z0-9+.-]*:/i;
const IG_URL = /^(?:https?:\/\/)?(?:www\.)?instagram\.com\/([^/?#\s]+)/i;
const IG_HANDLE = /^[A-Za-z0-9._]{1,30}$/;

/**
 * Returns an absolute http(s) URL, or null if the value isn't one.
 *
 * A bare "youtube.com/watch?v=x" is treated as a link and gains a scheme —
 * without one the browser resolves it relative to the current page, so an
 * admin clicking "Watch" would land on /admin/youtube.com/... instead.
 * Anything with a non-http scheme (javascript:, data:) returns null so it
 * never reaches an href.
 */
export function toHttpUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const value = raw.trim();
  if (!value) return null;

  const candidate = SCHEME.test(value) ? value : `https://${value}`;

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  // "video" would otherwise parse as the hostname of https://video
  if (!url.hostname.includes('.')) return null;

  return url.href;
}

/** Strips "@", a profile URL, or a trailing slash down to a bare handle. */
export function normalizeInstagram(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let value = raw.trim();
  if (!value) return null;

  const fromUrl = value.match(IG_URL);
  if (fromUrl) value = fromUrl[1];

  value = value.replace(/^@+/, '').replace(/\/+$/, '').trim();
  return value || null;
}

/** A profile URL, but only for values that actually look like a handle. */
export function instagramUrl(raw: string | null | undefined): string | null {
  const handle = normalizeInstagram(raw);
  if (!handle || !IG_HANDLE.test(handle)) return null;
  return `https://instagram.com/${handle}`;
}
