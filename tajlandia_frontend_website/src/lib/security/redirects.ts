import { routes, type AppRoute } from "@/lib/constants/routes";
import { resolveInternalPath } from "@/lib/security/urls";

const allowedRoutes = new Set<string>(Object.values(routes));

export function toSafeInternalRedirect(
  value: string | null | undefined,
): AppRoute | null {
  if (!value) {
    return null;
  }

  const path = resolveInternalPath(value);

  if (!path || !allowedRoutes.has(path)) {
    return null;
  }

  return path as AppRoute;
}
