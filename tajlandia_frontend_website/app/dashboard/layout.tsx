import { DashboardLanguageProvider } from "@/modules/dashboard/DashboardLanguageContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLanguageProvider>{children}</DashboardLanguageProvider>;
}
