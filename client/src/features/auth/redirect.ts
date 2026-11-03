// A safe redirect is a path on our own site: it starts with a single "/",
// and has no spaces. "//evil.com" and "/\evil.com" are not accepted,
// because browsers treat them as addresses on another website.
const SAFE_PATH = /^\/(?![/\\])\S*$/;

export function getSafeRedirect(value: string | null | undefined, fallback = "/"): string {
  return value && SAFE_PATH.test(value) ? value : fallback;
}

// The login address that brings the user back to the current page after login.
export function getLoginPath(pathname: string, search: string): string {
  return `/login?redirect=${encodeURIComponent(pathname + search)}`;
}
