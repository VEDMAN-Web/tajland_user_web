import { authedGet } from "@/lib/api/browser-client";
import { dashboardSchema, type DashboardData } from "../schemas/dashboard.schema";

/** The signed-in user's portfolio stats and featured regions (Dashboard home). */
export function getDashboard(signal?: AbortSignal): Promise<DashboardData> {
  return authedGet("/dashboard", dashboardSchema, { signal });
}
