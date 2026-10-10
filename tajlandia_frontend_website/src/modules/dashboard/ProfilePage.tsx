"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAbortError } from "@/lib/api/browser-client";
import { isApiError } from "@/lib/api/errors";
import { isAllowedRemoteImage } from "@/lib/config/remote-images";
import { routes } from "@/lib/constants/routes";
import { useAuth } from "@/lib/hooks/useAuth";
import { logError } from "@/lib/logging/logger";
import { AccountMenu } from "./AccountMenu";
import { DashboardNavbar } from "./DashboardNavbar";
import { useDashboardLanguage } from "./DashboardLanguageContext";
import { PageLoader } from "@/components/ui/PageLoader";
import type { AuthProfile } from "@/lib/api/profile.schema";
import { getProfile, profileName, storeProfile } from "./services/profile.client";

type ProfileState = { status: "loading" } | { status: "error" } | { status: "ready"; profile: AuthProfile };

const isQuietError = (error: unknown) =>
  isAbortError(error) || (isApiError(error) && error.code === "API_SESSION_EXPIRED");

function memberSince(raw: string | null | undefined) {
  if (!raw) return "";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useDashboardLanguage();
  const [state, setState] = useState<ProfileState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace(routes.login);
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const controller = new AbortController();
    getProfile(controller.signal)
      .then((profile) => {
        storeProfile(profile);
        setState({ status: "ready", profile });
      })
      .catch((error: unknown) => {
        if (isQuietError(error)) return;
        logError(error, "Failed to load profile");
        setState({ status: "error" });
      });
    return () => controller.abort();
  }, [isAuthenticated, reloadKey]);

  if (isLoading || !isAuthenticated) {
    return <PageLoader label={t("Loading profile...")} />;
  }

  const profile = state.status === "ready" ? state.profile : null;
  const loading = state.status === "loading";
  const image = profile?.profileImage;
  const photo = isAllowedRemoteImage(image) ? image : null;
  const since = memberSince(profile?.createdAt);

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

          {state.status === "error" ? (
            <div role="alert" className="mt-5 flex flex-col gap-3 rounded-[16px] border border-[#f3d0d3] bg-[#fff6f6] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-manrope text-[14px] font-semibold text-[#b42318]">{t("We couldn't load your profile.")}</p>
                <p className="font-manrope mt-0.5 text-[13px] text-[#8b939e]">{t("Please check your connection and try again.")}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setState({ status: "loading" });
                  setReloadKey((key) => key + 1);
                }}
                className="inline-flex h-10 shrink-0 cursor-pointer items-center justify-center rounded-[10px] bg-navy px-4 font-manrope text-[13px] font-medium text-white hover:bg-navy-deep"
              >
                {t("Try again")}
              </button>
            </div>
          ) : null}

          <div className="mt-5 flex flex-col gap-4 rounded-[16px] bg-white px-5 py-5 shadow-[0_8px_28px_rgba(11,31,77,0.06)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex min-w-0 items-center gap-4">
              <div className="relative h-14 w-14 shrink-0">
                <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-[#e8eef5]">
                  {photo ? (
                    <Image src={photo} alt="" fill sizes="56px" className="object-cover" />
                  ) : (
                    <Image src="/images/dashboard/profile.png" alt="" width={28} height={28} className="h-7 w-7 object-contain" />
                  )}
                </div>
                {profile?.isEmailVerified ? (
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#2563eb] text-white ring-2 ring-white">
                    <svg viewBox="0 0 12 12" aria-hidden="true" className="h-2.5 w-2.5">
                      <path d="M2.2 6.2 4.7 8.6 9.8 3.4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                ) : null}
              </div>
              <div className="min-w-0">
                {loading ? (
                  <span aria-hidden="true" className="block h-5 w-40 animate-pulse rounded-full bg-[#eef1f5] motion-reduce:animate-none" />
                ) : (
                  <h2 className="truncate font-manrope text-[18px] font-semibold leading-6 text-navy">
                    {(profile && profileName(profile)) || t("User")}
                  </h2>
                )}
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
              className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center rounded-[12px] bg-navy px-5 font-manrope text-[14px] font-medium text-white transition hover:bg-navy-deep"
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
              <Field label={t("First name")} value={loading ? null : profile?.firstName || t("Not provided")} />
              <Field label={t("Last name")} value={loading ? null : profile?.lastName || t("Not provided")} />
              <div className="sm:col-span-2">
                <Field label={t("Email")} value={loading ? null : profile?.email || t("Not provided")} />
              </div>
              <div className="sm:col-span-2">
                <Field label={t("Mobile Number")} value={loading ? null : profile?.mobileNumber || t("Not provided")} />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

/** `value` null: still loading (a skeleton bar). */
function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="block">
      <span className="font-manrope text-[13px] font-medium leading-5 text-[#5c6770]">{label}</span>
      <span className="font-manrope mt-2 flex h-11 min-w-0 items-center rounded-[10px] border border-[#e4e9ef] bg-white px-3.5 text-[14px] leading-none text-[#1a1a1a]">
        {value === null ? (
          <span aria-hidden="true" className="h-3.5 w-32 animate-pulse rounded-full bg-[#eef1f5] motion-reduce:animate-none" />
        ) : (
          <span className="truncate">{value}</span>
        )}
      </span>
    </div>
  );
}
