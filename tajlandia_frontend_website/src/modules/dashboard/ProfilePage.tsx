"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { routes } from "@/lib/constants/routes";
import { useAuth } from "@/lib/hooks/useAuth";
import { AccountMenu } from "./AccountMenu";
import { DashboardNavbar } from "./DashboardNavbar";
import { useDashboardLanguage } from "./DashboardLanguageContext";

export function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuth();
  const { t } = useDashboardLanguage();

  if (isLoading) return <main className="flex min-h-[100svh] items-center justify-center bg-[#f7fafc] text-sm text-muted">{t("Loading profile...")}</main>;
  if (!isAuthenticated) {
    router.replace(routes.login);
    return null;
  }

  const [firstName = "User", ...lastParts] = (user?.name ?? "User").trim().split(/\s+/);
  const lastName = lastParts.join(" ");
  const email = user?.email ?? "Not provided";

  return (
    <div className="min-h-[100svh] bg-[#f7fafc] text-navy">
      <DashboardNavbar active="home" />
      <main className="mx-auto grid w-[92%] max-w-none gap-8 px-5 pb-12 pt-10 sm:px-8 lg:grid-cols-[256px_minmax(0,1fr)] lg:gap-7 lg:pt-14">
        <AccountMenu active="profile" />

        <section className="min-w-0">
          <div className="border-b border-[#e1e8ed] pb-4"><h1 className="text-[30px] font-semibold tracking-[-0.04em] text-navy sm:text-[32px]">{t("Profile")}</h1><p className="mt-1 text-[12px] text-[#7b858f]">{t("Manage your personal information and account.")}</p></div>
          <div className="mt-5 flex flex-col items-start justify-between gap-4 rounded-[15px] bg-white p-5 shadow-[0_5px_24px_rgba(11,31,77,0.08)] sm:flex-row sm:items-center sm:p-6">
            <div className="flex items-center gap-4"><div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-[#e9eef2]">{user?.avatarUrl ? <img src={user.avatarUrl} alt={t("Profile")} className="h-full w-full object-cover" /> : <Image src="/images/dashboard/profile.png" alt="" width={28} height={28} />}</div><div><h2 className="text-[19px] font-medium text-navy">{user?.name || t("User")}</h2><p className="mt-1 text-[10px] text-[#9aa3ad]">{t("Member since —")}</p></div></div>
            <Link href={routes.editProfile} className="rounded-[9px] bg-navy px-6 py-3 text-[12px] text-white">{t("Edit Profile →")}</Link>
          </div>
          <div className="mt-5 rounded-[15px] bg-white p-5 shadow-[0_5px_24px_rgba(11,31,77,0.08)] sm:p-6"><div className="border-b border-[#e8edf1] pb-3"><h2 className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#68727c]">{t("Personal Information")}</h2><p className="mt-1 text-[10px] text-[#b0b7be]">{t("Official account information registered on file")}</p></div><div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label={t("First name")} value={firstName} /><Field label={t("Last name")} value={lastName || t("Not provided")} /><div className="sm:col-span-2"><Field label={t("Email")} value={email} /></div><div className="sm:col-span-2"><Field label={t("Mobile Number")} value={user?.phone || t("Not provided")} /></div></div></div>
        </section>
      </main>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return <label className="block text-[11px] text-[#85909c]"><span>{label}</span><span className="mt-1.5 flex h-10 items-center rounded-[10px] border border-[#e3e8ed] px-3 text-[12px] text-[#242b32]">{value}</span></label>;
}
