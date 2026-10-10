"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { isAbortError } from "@/lib/api/browser-client";
import { isApiError } from "@/lib/api/errors";
import { PROFILE_IMAGE_MAX_BYTES, PROFILE_IMAGE_TYPES, type AuthProfile } from "@/lib/api/profile.schema";
import { isAllowedRemoteImage } from "@/lib/config/remote-images";
import { routes } from "@/lib/constants/routes";
import { useAuth } from "@/lib/hooks/useAuth";
import { logError } from "@/lib/logging/logger";
import { countryCodes, defaultCountry, findCountry, phonePlaceholder, splitStoredPhone } from "@/lib/phone/countries";
import { AccountMenu } from "./AccountMenu";
import { DashboardNavbar } from "./DashboardNavbar";
import { useDashboardLanguage } from "./DashboardLanguageContext";
import { PageLoader } from "@/components/ui/PageLoader";
import { editProfileSchema, type EditProfileErrors } from "./schemas/edit-profile.schema";
import { getProfile, storeProfile, updateProfile } from "./services/profile.client";

type FormValues = { firstName: string; lastName: string; countryCode: string; phone: string };

type ProfileState = { status: "loading" } | { status: "error" } | { status: "ready"; profile: AuthProfile };

const emptyValues: FormValues = { firstName: "", lastName: "", countryCode: defaultCountry.id, phone: "" };

const isQuietError = (error: unknown) =>
  isAbortError(error) || (isApiError(error) && error.code === "API_SESSION_EXPIRED");

function formValues(profile: AuthProfile): FormValues {
  const phone = splitStoredPhone(profile.mobileNumber ?? undefined);
  return {
    firstName: profile.firstName ?? "",
    lastName: profile.lastName ?? "",
    countryCode: phone.countryCode,
    phone: phone.phone,
  };
}

function profilePhoto(profile: AuthProfile | null) {
  const image = profile?.profileImage;
  return isAllowedRemoteImage(image) ? image : undefined;
}

export function EditProfilePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useDashboardLanguage();
  const fileRef = useRef<HTMLInputElement>(null);
  const countryMenuRef = useRef<HTMLDivElement>(null);
  const [countryOpen, setCountryOpen] = useState(false);
  const [profileState, setProfileState] = useState<ProfileState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);
  const [values, setValues] = useState<FormValues>(emptyValues);
  // A data URL preview of the newly chosen photo; the saved photo otherwise.
  const [photoPreview, setPhotoPreview] = useState<string | undefined>();
  const [photoFile, setPhotoFile] = useState<File | undefined>();
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<EditProfileErrors>({});
  const [photoError, setPhotoError] = useState("");
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const profile = profileState.status === "ready" ? profileState.profile : null;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace(routes.login);
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const controller = new AbortController();
    getProfile(controller.signal)
      .then((loaded) => {
        storeProfile(loaded);
        setValues(formValues(loaded));
        setProfileState({ status: "ready", profile: loaded });
      })
      .catch((error: unknown) => {
        if (isQuietError(error)) return;
        logError(error, "Failed to load profile for editing");
        setProfileState({ status: "error" });
      });
    return () => controller.abort();
  }, [isAuthenticated, reloadKey]);

  useEffect(() => {
    if (!countryOpen) return;

    function closeOnOutside(event: MouseEvent) {
      if (!countryMenuRef.current?.contains(event.target as Node)) setCountryOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setCountryOpen(false);
    }

    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [countryOpen]);

  if (isLoading || !isAuthenticated || profileState.status === "loading") {
    return <PageLoader label={t("Loading profile...")} />;
  }

  const selectedCountry = findCountry(values.countryCode);
  const avatarUrl = photoPreview ?? profilePhoto(profile);

  function update(field: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function updateCountry(countryId: string) {
    const country = findCountry(countryId);
    setValues((current) => ({
      ...current,
      countryCode: country.id,
      phone: current.phone.slice(0, country.digits),
    }));
    setErrors((current) => ({ ...current, phone: undefined }));
  }

  function updatePhone(value: string) {
    const country = findCountry(values.countryCode);
    update("phone", value.replace(/\D/g, "").slice(0, country.digits));
  }

  function changePhoto(file: File | undefined) {
    if (fileRef.current) fileRef.current.value = "";
    if (!file) return;
    if (!(PROFILE_IMAGE_TYPES as readonly string[]).includes(file.type)) {
      setPhotoError(t("Please choose a JPG, PNG or WebP image."));
      return;
    }
    if (file.size > PROFILE_IMAGE_MAX_BYTES) {
      setPhotoError(t("Profile photo must be 2 MB or smaller."));
      return;
    }
    setPhotoError("");
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(typeof reader.result === "string" ? reader.result : undefined);
    reader.readAsDataURL(file);
  }

  function discardPhoto() {
    setPhotoFile(undefined);
    setPhotoPreview(undefined);
    setPhotoError("");
    if (fileRef.current) fileRef.current.value = "";
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;
    setFormError("");
    const result = editProfileSchema.safeParse({ ...values, termsAccepted: agreed });
    if (!result.success) {
      const nextErrors: EditProfileErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if (
          (field === "firstName" || field === "lastName" || field === "phone" || field === "termsAccepted") &&
          !nextErrors[field]
        ) {
          nextErrors[field] = issue.message;
        }
      }
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setIsSaving(true);
    const country = findCountry(values.countryCode);
    const saved = await updateProfile({
      firstName: result.data.firstName,
      lastName: result.data.lastName,
      mobileNumber: `${country.dial}${values.phone}`,
      profileImage: photoFile,
    });
    setIsSaving(false);

    if (saved.ok) {
      storeProfile(saved.profile);
      setProfileState({ status: "ready", profile: saved.profile });
      setValues(formValues(saved.profile));
      discardPhoto();
      setShowSuccess(true);
      return;
    }

    if (saved.sessionExpired) {
      router.replace(`${routes.login}?next=${encodeURIComponent(routes.editProfile)}`);
      return;
    }

    const fieldErrors = saved.fieldErrors ?? {};
    setErrors({
      firstName: fieldErrors.firstName,
      lastName: fieldErrors.lastName,
      phone: fieldErrors.mobileNumber,
    });
    if (fieldErrors.profileImage) setPhotoError(t(fieldErrors.profileImage));
    if (!fieldErrors.firstName && !fieldErrors.lastName && !fieldErrors.mobileNumber && !fieldErrors.profileImage) {
      setFormError(t(saved.message));
    }
  }

  return (
    <div className="min-h-[100svh] bg-[#f7f9fc] text-navy">
      <DashboardNavbar active="home" />
      <main className="mx-auto grid w-full max-w-[1180px] gap-6 px-5 pb-14 pt-8 sm:px-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start lg:gap-7">
        <AccountMenu active="profile" />

        <section className="min-w-0">
          <h1 className="font-manrope text-[28px] font-semibold leading-none tracking-[-0.03em] text-navy sm:text-[32px]">
            {t("Edit Profile")}
          </h1>
          <p className="font-manrope mt-2 text-[14px] leading-5 text-[#8b939e]">
            {t("Manage your personal information and account.")}
          </p>

          {profileState.status === "error" ? (
            <div role="alert" className="mt-5 flex flex-col gap-3 rounded-[16px] border border-[#f3d0d3] bg-[#fff6f6] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-manrope text-[14px] font-semibold text-[#b42318]">{t("We couldn't load your profile.")}</p>
                <p className="font-manrope mt-0.5 text-[13px] text-[#8b939e]">{t("Please check your connection and try again.")}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setProfileState({ status: "loading" });
                  setReloadKey((key) => key + 1);
                }}
                className="inline-flex h-10 shrink-0 cursor-pointer items-center justify-center rounded-[10px] bg-navy px-4 font-manrope text-[13px] font-medium text-white hover:bg-navy-deep"
              >
                {t("Try again")}
              </button>
            </div>
          ) : null}

          <div className="mt-5 flex flex-col gap-4 rounded-[16px] bg-white px-5 py-4 shadow-[0_8px_28px_rgba(11,31,77,0.06)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#e8eef5]">
              {photoPreview ? (
                // A local data URL preview; next/image can't optimise it.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoPreview} alt="" className="h-full w-full object-cover" />
              ) : avatarUrl ? (
                <Image src={avatarUrl} alt="" fill sizes="56px" className="object-cover" />
              ) : (
                <Image src="/images/dashboard/profile.png" alt="" width={28} height={28} className="h-7 w-7 object-contain" />
              )}
            </div>
            <div className="flex flex-col items-start gap-1.5 sm:items-end">
              <div className="flex flex-wrap items-center gap-3">
                <input
                  ref={fileRef}
                  type="file"
                  accept={PROFILE_IMAGE_TYPES.join(",")}
                  className="hidden"
                  onChange={(event) => changePhoto(event.target.files?.[0])}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex h-11 cursor-pointer items-center justify-center rounded-[12px] bg-navy px-5 font-manrope text-[14px] font-medium leading-none text-white transition hover:bg-navy-deep"
                >
                  {t("Change Photo")}
                </button>
                <button
                  type="button"
                  onClick={discardPhoto}
                  disabled={!photoFile}
                  className="inline-flex h-11 cursor-pointer items-center disabled:cursor-not-allowed disabled:opacity-50 justify-center rounded-[12px] border border-[#e4e9ef] bg-white px-5 font-manrope text-[14px] font-medium leading-none text-[#3d4650] transition hover:bg-[#f7f9fc]"
                >
                  {t("Discard")}
                </button>
              </div>
              {photoError ? (
                <p role="alert" className="font-manrope text-[12px] leading-4 text-[#d52b35]">
                  {photoError}
                </p>
              ) : null}
            </div>
          </div>

          <form noValidate onSubmit={save} className="mt-4">
            <div className="rounded-[16px] bg-white px-5 py-5 shadow-[0_8px_28px_rgba(11,31,77,0.06)] sm:px-6 sm:py-6">
              <div className="border-b border-[#e8edf2] pb-4">
                <h2 className="font-manrope text-[11px] font-bold uppercase tracking-[0.14em] text-[#5c6770]">
                  {t("Personal Information")}
                </h2>
                <p className="font-manrope mt-1 text-[13px] leading-5 text-[#8b939e]">
                  {t("Official cadastral identity registered on file")}
                </p>
              </div>

              <div className="mt-5 grid gap-x-5 gap-y-5 sm:grid-cols-2">
                <EditField id="edit-first-name" label={t("First name")} value={values.firstName} error={errors.firstName ? t(errors.firstName) : undefined} autoComplete="given-name" onChange={(value) => update("firstName", value)} />
                <EditField id="edit-last-name" label={t("Last name")} value={values.lastName} error={errors.lastName ? t(errors.lastName) : undefined} autoComplete="family-name" onChange={(value) => update("lastName", value)} />
                <div className="sm:col-span-2">
                  <EditField id="edit-email" label={t("Email")} value={profile?.email ?? ""} type="email" autoComplete="email" readOnly hint={t("Email can't be changed here.")} />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="edit-phone" className="font-manrope text-[14px] font-semibold leading-5 text-[#1a1a1a]">
                    {t("Mobile Number")}
                    <span className="text-[#e11d2e]">*</span>
                  </label>
                  <div className={`relative mt-2 flex h-11 items-center rounded-[10px] border bg-white focus-within:border-navy ${countryOpen ? "z-30" : ""} ${errors.phone ? "border-[#d52b35] focus-within:border-[#d52b35]" : "border-[#e4e9ef]"}`}>
                    <div ref={countryMenuRef} className="relative h-full shrink-0">
                      <button
                        type="button"
                        aria-haspopup="listbox"
                        aria-expanded={countryOpen}
                        aria-label={`${selectedCountry.name} (${selectedCountry.dial})`}
                        onClick={() => setCountryOpen((open) => !open)}
                        className="font-manrope flex h-full cursor-pointer items-center gap-1.5 border-r border-[#e4e9ef] px-3 text-[14px] font-medium leading-none text-[#1a1a1a]"
                      >
                        <CountryFlag id={selectedCountry.id} />
                        <span>({selectedCountry.dial})</span>
                        <svg viewBox="0 0 12 12" aria-hidden="true" className="h-3 w-3 text-[#8b939e]">
                          <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                        </svg>
                      </button>
                      {countryOpen ? (
                        <ul role="listbox" aria-label={t("Mobile Number")} className="absolute left-0 top-[calc(100%+6px)] z-30 max-h-56 w-36 overflow-auto rounded-[10px] border border-[#e4e9ef] bg-white py-1 shadow-[0_12px_30px_rgba(11,31,77,0.12)]">
                          {countryCodes.map((country) => (
                            <li key={country.id} role="presentation">
                              <button
                                type="button"
                                role="option"
                                aria-selected={country.id === selectedCountry.id}
                                onClick={() => {
                                  updateCountry(country.id);
                                  setCountryOpen(false);
                                }}
                                className={`font-manrope flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-[13px] font-medium text-[#1a1a1a] ${country.id === selectedCountry.id ? "bg-[#f4f6fa]" : "hover:bg-[#f7f9fc]"}`}
                              >
                                <CountryFlag id={country.id} />
                                <span>({country.dial})</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                    <input
                      id="edit-phone"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      value={values.phone}
                      onChange={(event) => updatePhone(event.target.value)}
                      placeholder={phonePlaceholder(selectedCountry.digits)}
                      aria-invalid={Boolean(errors.phone)}
                      aria-describedby={errors.phone ? "edit-phone-error" : undefined}
                      className="font-manrope h-full min-w-0 flex-1 border-0 bg-transparent px-3.5 text-[14px] leading-none text-[#1a1a1a] outline-none placeholder:text-[#b0b7be]"
                    />
                  </div>
                  {errors.phone ? (
                    <p id="edit-phone-error" className="font-manrope mt-1.5 text-[12px] leading-4 text-[#d52b35]">
                      {t(errors.phone)}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="mt-5">
              <div className="flex items-start gap-2.5 sm:items-center">
                <input
                  id="profile-agree"
                  type="checkbox"
                  checked={agreed}
                  onChange={(event) => {
                    setAgreed(event.target.checked);
                    setErrors((current) => ({ ...current, termsAccepted: undefined }));
                  }}
                  aria-invalid={Boolean(errors.termsAccepted)}
                  aria-describedby={errors.termsAccepted ? "edit-terms-error" : undefined}
                  className="peer sr-only"
                />
                <label
                  htmlFor="profile-agree"
                  className={`mt-0.5 flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded-[4px] border bg-white text-white peer-checked:border-navy peer-checked:bg-navy peer-checked:[&>svg]:opacity-100 peer-focus-visible:ring-2 peer-focus-visible:ring-navy/30 sm:mt-0 ${errors.termsAccepted ? "border-[#d52b35]" : "border-[#c5ced6]"}`}
                >
                  <svg viewBox="0 0 12 12" aria-hidden="true" className="h-2.5 w-2.5 opacity-0">
                    <path d="M2.2 6.2 4.7 8.6 9.8 3.4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </label>
                <p className="font-manrope text-[13px] leading-5 text-[#1a1a1a] sm:whitespace-nowrap">
                  <label htmlFor="profile-agree" className="cursor-pointer">
                    {t("I agree to the")}
                  </label>{" "}
                  <Link href={routes.dashboardTerms} className="font-medium text-[#e11d2e] hover:underline">
                    {t("Terms of Service")}
                  </Link>{" "}
                  {t("and")}{" "}
                  <Link href={routes.dashboardPrivacy} className="font-medium text-[#e11d2e] hover:underline">
                    {t("Privacy Policy")}
                  </Link>.
                </p>
              </div>
              {errors.termsAccepted ? (
                <p id="edit-terms-error" className="font-manrope mt-1.5 text-[12px] leading-4 text-[#d52b35]">
                  {t(errors.termsAccepted)}
                </p>
              ) : null}
              </div>
            </div>

            {formError ? (
              <p role="alert" className="font-manrope mt-4 rounded-[10px] border border-[#f3d0d3] bg-[#fff6f6] px-4 py-3 text-[13px] leading-5 text-[#b42318]">
                {formError}
              </p>
            ) : null}

            <div className="mt-5 flex flex-col gap-4 border-t border-[#e4e9ef] pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-manrope flex items-center gap-2 text-[12px] leading-4 text-[#8b939e]">
                <Image src="/images/profile/ic_privacy.svg" alt="" width={14} height={14} className="h-3.5 w-3.5 shrink-0" />
                <span>{t("All changes verified under 256-bit Cadastral Escrow protocol.")}</span>
              </p>
              <div className="flex items-center justify-end gap-3">
                <Link
                  href={routes.profile}
                  className="inline-flex h-11 cursor-pointer items-center justify-center rounded-[12px] border border-[#e4e9ef] bg-white px-5 font-manrope text-[14px] font-medium leading-none text-[#3d4650] transition hover:bg-[#f7f9fc]"
                >
                  {t("Cancel")}
                </Link>
                <button
                  type="submit"
                  disabled={isSaving || !profile}
                  aria-busy={isSaving}
                  className="inline-flex h-11 cursor-pointer items-center justify-center rounded-[12px] bg-navy px-5 font-manrope text-[14px] font-medium leading-none text-white transition hover:bg-navy-deep disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? t("Saving...") : t("Save Changes")}
                </button>
              </div>
            </div>
          </form>
        </section>
      </main>

      {showSuccess ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#5c6770]/45 px-4">
          <div role="dialog" aria-modal="true" aria-labelledby="profile-success-title" className="relative w-full max-w-[380px] rounded-[16px] bg-white px-6 pb-6 pt-5 text-center shadow-[0_18px_50px_rgba(17,24,39,0.18)]">
            <button type="button" aria-label={t("Close")} onClick={() => setShowSuccess(false)} className="absolute right-4 top-4 cursor-pointer text-[#9aa3ad]">
              <svg viewBox="0 0 16 16" aria-hidden="true" className="h-4 w-4">
                <path d="M4 4 12 12M12 4 4 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
            <Image src="/images/profile/ic_profile-update.png" alt="" width={56} height={56} className="mx-auto h-14 w-14" />
            <h2 id="profile-success-title" className="font-manrope mt-4 text-[18px] font-semibold leading-none tracking-[-0.02em] text-[#1a1a1a]">
              {t("Profile updated successfully.")}
            </h2>
            <p className="font-manrope mt-2 text-[13px] leading-5 text-[#8b939e]">
              {t("Your profile has been saved successfully.")}
            </p>
            <button type="button" onClick={() => { setShowSuccess(false); router.push(routes.profile); }} className="font-manrope mt-5 h-11 w-full cursor-pointer rounded-[10px] bg-navy text-[14px] font-medium leading-none text-white">
              {t("Okay")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function EditField({
  id,
  label,
  value,
  error,
  hint,
  type = "text",
  placeholder,
  autoComplete,
  readOnly = false,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  error?: string;
  /** Helper text under the field when there is no error. */
  hint?: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  readOnly?: boolean;
  onChange?: (value: string) => void;
}) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div>
      <label htmlFor={id} className="font-manrope text-[14px] font-semibold leading-5 text-[#1a1a1a]">
        {label}
        {readOnly ? null : <span className="text-[#e11d2e]">*</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        readOnly={readOnly}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={`font-manrope mt-2 h-11 w-full rounded-[10px] border px-3.5 text-[14px] leading-none outline-none placeholder:text-[#b0b7be] ${
          readOnly ? "cursor-not-allowed bg-[#f7f9fc] text-[#5c6770]" : "bg-white text-[#1a1a1a] focus:border-navy"
        } ${error ? "border-[#d52b35] focus:border-[#d52b35]" : "border-[#e4e9ef]"}`}
      />
      {error ? (
        <p id={`${id}-error`} className="font-manrope mt-1.5 text-[12px] leading-4 text-[#d52b35]">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="font-manrope mt-1.5 text-[12px] leading-4 text-[#8b939e]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
