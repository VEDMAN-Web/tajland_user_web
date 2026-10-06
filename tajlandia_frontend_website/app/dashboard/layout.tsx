import { DashboardLanguageProvider } from "@/modules/dashboard/DashboardLanguageContext";
import { DashboardAuthGuard } from "@/modules/dashboard/DashboardAuthGuard";

// The language provider wraps the guard so its loader is translated too.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLanguageProvider>
      <DashboardAuthGuard>{children}</DashboardAuthGuard>
    </DashboardLanguageProvider>
  );
}
