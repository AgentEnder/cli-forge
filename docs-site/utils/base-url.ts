export function applyBaseUrl(
  href: string,
  baseUrl: string | undefined | null = import.meta.env.BASE_URL
): string {
  // Return href unchanged if:
  // - baseUrl is falsy (undefined, null, empty string)
  // - baseUrl is root path (/, ./, .)
  // - href is an absolute URL
  if (!baseUrl || baseUrl === '/' || baseUrl === './' || baseUrl === '.') {
    return href;
  }
  if (href.startsWith('http://') || href.startsWith('https://')) {
    return href; // Absolute URL, do not modify
  }
  // Ensure baseUrl ends with a slash
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
  // Ensure href does not start with a slash
  const normalizedHref = href.startsWith('/') ? href.substring(1) : href;
  return normalizedBaseUrl + normalizedHref;
}
