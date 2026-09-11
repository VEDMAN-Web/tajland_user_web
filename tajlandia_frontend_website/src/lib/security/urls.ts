const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

export function isSafeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return ALLOWED_PROTOCOLS.has(url.protocol);
  } catch {
    return false;
  }
}

export function toSafeExternalUrl(value: string): URL | null {
  if (!isSafeHttpUrl(value)) {
    return null;
  }

  return new URL(value);
}

export function isSameOriginUrl(value: string, origin: string): boolean {
  try {
    const url = new URL(value, origin);
    const originUrl = new URL(origin);
    return url.origin === originUrl.origin;
  } catch {
    return false;
  }
}

export function resolveInternalPath(path: string): string | null {
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) {
    return null;
  }

  if (path.includes("://")) {
    return null;
  }

  return path;
}

export function joinSameOriginUrl(baseUrl: string, path: string): URL | null {
  if (path.includes("://") || path.startsWith("//") || path.includes("\\")) {
    return null;
  }

  try {
    const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
    const url = new URL(path.replace(/^\/+/, ""), normalizedBase);
    const base = new URL(normalizedBase);

    if (url.origin !== base.origin) {
      return null;
    }

    return url;
  } catch {
    return null;
  }
}
