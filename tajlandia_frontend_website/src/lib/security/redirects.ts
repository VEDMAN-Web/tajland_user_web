import { routes } from "@/lib/constants/routes";
import { resolveInternalPath } from "@/lib/security/urls";

const allowedRoutes = new Set<string>(Object.values(routes));
// A leaderboard owner's profile (`/dashboard/leaderboard/{userId}`): the id makes the path
// dynamic, so it can't be in `routes`. The public leaderboard sends visitors here via login.
const LEADERBOARD_OWNER_PATH = /^\/dashboard\/leaderboard\/[a-f\d]{24}$/i;

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

  if (!path || !pathname || !(allowedRoutes.has(pathname) || LEADERBOARD_OWNER_PATH.test(pathname))) {
    return null;
  }

  return path;
}
