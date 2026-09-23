import { DashboardLanguageProvider } from "@/modules/dashboard/DashboardLanguageContext";
import { DashboardAuthGuard } from "@/modules/dashboard/DashboardAuthGuard";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardAuthGuard>
      <DashboardLanguageProvider>{children}</DashboardLanguageProvider>
    </DashboardAuthGuard>
  );
}
