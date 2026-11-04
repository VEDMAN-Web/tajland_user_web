import { DashboardLanguageProvider } from "@/modules/dashboard/DashboardLanguageContext";
import { DashboardAuthGuard } from "@/modules/dashboard/DashboardAuthGuard";
import { DashboardShell } from "@/modules/dashboard";

// The language provider wraps the guard so its loader is translated too. The shell (navbar,
// account sidebar) sits inside the guard, so it only shows for a signed-in user and stays
// mounted while the pages change.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLanguageProvider>
      <DashboardAuthGuard>
        <DashboardShell>{children}</DashboardShell>
      </DashboardAuthGuard>
    </DashboardLanguageProvider>
  );
}
