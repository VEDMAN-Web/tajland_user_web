"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { routes } from "@/lib/constants/routes";
import { useAuth, type AuthUser } from "@/lib/hooks/useAuth";
import { AccountMenu } from "./AccountMenu";
import { DashboardNavbar } from "./DashboardNavbar";
import { useDashboardLanguage } from "./DashboardLanguageContext";

function memberSince(user: AuthUser) {
  const raw = user.createdAt ?? user.memberSince;
  if (!raw) return "";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuth();
  const { t } = useDashboardLanguage();

  if (isLoading) {
    return <main className="flex min-h-[100svh] items-center justify-center bg-[#f7f9fc] text-sm text-muted">{t("Loading profile...")}</main>;
  }

  if (!isAuthenticated || !user) {
    router.replace(routes.login);
    return null;
  }

  const [firstName = t("User"), ...lastParts] = (user.name ?? t("User")).trim().split(/\s+/);
  const lastName = lastParts.join(" ");
  const since = memberSince(user);

  return (
    <div className="min-h-[100svh] bg-[#f7f9fc] text-navy">
      <DashboardNavbar active="home" />
      <main className="mx-auto grid w-full max-w-[1180px] gap-6 px-5 pb-14 pt-8 sm:px-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start lg:gap-7">
        <AccountMenu active="profile" />

        <section className="min-w-0">
          <h1 className="font-manrope text-[28px] font-semibold leading-none tracking-[-0.03em] text-navy sm:text-[32px]">
            {t("Profile")}
          </h1>
          <p className="font-manrope mt-2 text-[14px] leading-5 text-[#8b939e]">
            {t("Manage your personal information and account.")}
          </p>

          <div className="mt-5 flex flex-col gap-4 rounded-[16px] bg-white px-5 py-5 shadow-[0_8px_28px_rgba(11,31,77,0.06)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex min-w-0 items-center gap-4">
              <div className="relative h-14 w-14 shrink-0">
                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-[#e8eef5]">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Image src="/images/dashboard/profile.png" alt="" width={28} height={28} className="h-7 w-7 object-contain" />
                  )}
                </div>
                {user.isEmailVerified !== false ? (
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#2563eb] text-white ring-2 ring-white">
                    <svg viewBox="0 0 12 12" aria-hidden="true" className="h-2.5 w-2.5">
                      <path d="M2.2 6.2 4.7 8.6 9.8 3.4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                ) : null}
              </div>
              <div className="min-w-0">
                <h2 className="truncate font-manrope text-[18px] font-semibold leading-6 text-navy">
                  {user.name || t("User")}
                </h2>
                <p className="font-manrope mt-1 flex items-center gap-1.5 text-[12px] leading-4 text-[#8b939e]">
                  <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5 shrink-0">
                    <rect x="2" y="3" width="12" height="11" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
                    <path d="M2 6.5h12M5 2v2.5M11 2v2.5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                  <span>{since ? `${t("Member since")} ${since}` : t("Member since —")}</span>
                </p>
              </div>
            </div>
            <Link
              href={routes.editProfile}
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-[12px] bg-navy px-5 font-manrope text-[14px] font-medium text-white transition hover:bg-navy-deep"
            >
              {t("Edit Profile →")}
            </Link>
          </div>

          <div className="mt-4 rounded-[16px] bg-white px-5 py-5 shadow-[0_8px_28px_rgba(11,31,77,0.06)] sm:px-6 sm:py-6">
            <div className="border-b border-[#e8edf2] pb-4">
              <h2 className="font-manrope text-[11px] font-bold uppercase tracking-[0.14em] text-[#5c6770]">
                {t("Personal Information")}
              </h2>
              <p className="font-manrope mt-1 text-[13px] leading-5 text-[#8b939e]">
                {t("Official cadastral identity registered on file")}
              </p>
            </div>
            <div className="mt-5 grid gap-x-5 gap-y-5 sm:grid-cols-2">
              <Field label={t("First name")} value={firstName} />
              <Field label={t("Last name")} value={lastName || t("Not provided")} />
              <div className="sm:col-span-2">
                <Field label={t("Email")} value={user.email || t("Not provided")} />
              </div>
              <div className="sm:col-span-2">
                <Field label={t("Mobile Number")} value={user.phone || t("Not provided")} />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className="font-manrope text-[13px] font-medium leading-5 text-[#5c6770]">{label}</span>
      <span className="font-manrope mt-2 flex h-11 items-center rounded-[10px] border border-[#e4e9ef] bg-white px-3.5 text-[14px] leading-none text-[#1a1a1a]">
        {value}
      </span>
    </label>
  );
}
