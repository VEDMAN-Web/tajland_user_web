import { routes } from "@/lib/constants/routes";
import { resolveInternalPath } from "@/lib/security/urls";

const allowedRoutes = new Set<string>(Object.values(routes));

/**
 * `value` when it is a known app route, or null. A query string is kept (e.g.
 * `/dashboard/explore?regionId=…` opens that region); only the path is checked.
 */
export function toSafeInternalRedirect(
  value: string | null | undefined,
): string | null {
  if (!value) {
    return null;
  }

  const path = resolveInternalPath(value);
  const pathname = path?.split(/[?#]/, 1)[0];

  if (!path || !pathname || !allowedRoutes.has(pathname)) {
    return null;
  }

  return path;
}
