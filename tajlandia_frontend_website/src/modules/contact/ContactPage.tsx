"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { routes } from "@/lib/constants/routes";
import { countryCodes, defaultCountry, phonePlaceholder } from "@/lib/phone/countries";

type FormValues = {
  firstName: string;
  lastName: string;
  email: string;
  countryCode: string;
  phone: string;
  message: string;
};

const initialValues: FormValues = {
  firstName: "",
  lastName: "",
  email: "",
  countryCode: defaultCountry.id,
  phone: "",
  message: "",
};

type ContactErrors = Partial<Record<keyof FormValues, string>>;

function fieldClass(hasError: boolean) {
  return `mt-2 h-11 w-full rounded-[10px] border bg-white px-3 text-[14px] font-normal text-navy outline-none placeholder:text-[#c5ccd6] focus:border-navy focus:ring-2 focus:ring-navy/10 ${hasError ? "border-[#d52b35]" : "border-[#e4e9f0]"}`;
}

function validateContact(values: FormValues): ContactErrors {
  const errors: ContactErrors = {};

  if (!values.firstName.trim()) errors.firstName = "First name is required";
  if (!values.lastName.trim()) errors.lastName = "Last name is required";
  if (!values.email.trim()) errors.email = "Email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Please enter a valid email address";
  }
  const country = countryCodes.find((item) => item.id === values.countryCode) ?? defaultCountry;
  if (!values.phone) errors.phone = "Phone number is required";
  else if (values.phone.length !== country.digits) {
    errors.phone = `Enter a ${country.digits}-digit phone number`;
  }
  if (!values.message.trim()) errors.message = "Message is required";

  return errors;
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[18px] w-[18px] shrink-0">
      <path d="M3 5.5h18v13H3zM4.8 7l7.2 5.2L19.2 7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[18px] w-[18px] shrink-0">
      <path d="M7.4 3.5 10 3l2 4.5-2.1 1.7c.8 1.8 2.1 3.1 3.9 3.9l1.7-2.1L20 13l-.5 2.6c-.3 1.5-1.6 2.5-3.1 2.4-6.6-.5-11.9-5.8-12.4-12.4-.1-1.5.9-2.8 2.4-3.1Z" fill="currentColor" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[18px] w-[18px] shrink-0">
      <path d="M12 2.8a6.2 6.2 0 0 0-6.2 6.2c0 4.6 6.2 12.2 6.2 12.2s6.2-7.6 6.2-12.2A6.2 6.2 0 0 0 12 2.8Zm0 8.8a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z" fill="currentColor" />
    </svg>
  );
}

export function ContactPage() {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const countryMenuRef = useRef<HTMLDivElement>(null);
  const selectedCountry = countryCodes.find((item) => item.id === values.countryCode) ?? defaultCountry;

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

  function updateField(field: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitted(false);
  }

  function updateCountry(countryId: string) {
    const country = countryCodes.find((item) => item.id === countryId) ?? defaultCountry;
    setValues((current) => ({
      ...current,
      countryCode: country.id,
      phone: current.phone.slice(0, country.digits),
    }));
    setErrors((current) => ({ ...current, phone: undefined }));
    setSubmitted(false);
  }

  function updatePhone(value: string) {
    const country = countryCodes.find((item) => item.id === values.countryCode) ?? defaultCountry;
    updateField("phone", value.replace(/\D/g, "").slice(0, country.digits));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateContact(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setSubmitted(false);
      return;
    }

    setSubmitted(true);
  }

  return (
    <main className="bg-white pb-16 pt-12 sm:pt-16">
      <Container>
        <header className="mx-auto max-w-[640px] text-center">
          <h1 className="font-[family-name:var(--font-playfair-display)] text-[42px] font-semibold leading-none tracking-[-0.03em] text-navy sm:text-[52px]">
            Get in <span className="italic text-brand-red">Touch</span>
          </h1>
          <p className="mt-3 font-[family-name:var(--font-manrope)] text-[16px] font-normal text-[#8a99aa] sm:text-[18px]">
            Choose the way that works best for you.
          </p>
        </header>

        <div className="mx-auto mt-10 grid max-w-[1080px] items-stretch gap-4 rounded-[28px] bg-white p-3 shadow-[0_18px_50px_rgba(11,31,77,0.08)] sm:p-4 lg:mt-12 lg:grid-cols-[0.92fr_1.08fr] lg:gap-8 lg:p-5">
          <aside className="relative flex min-h-[460px] flex-col overflow-hidden rounded-[22px] text-white lg:min-h-[560px]">
            <Image
              src="/images/home/get-in-touch.jpg"
              alt=""
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 460px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/25 to-black/60" />
            <div className="relative flex flex-1 flex-col px-7 py-8 sm:px-8 sm:py-9">
              <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-white/80">Send a message</p>
              <h2 className="mt-3 font-[family-name:var(--font-playfair-display)] text-[32px] font-semibold leading-none sm:text-[36px]">
                How can we help?
              </h2>
              <p className="mt-4 max-w-[22rem] font-[family-name:var(--font-manrope)] text-[14px] font-normal leading-[1.6] text-white/85 sm:text-[15px]">
                Tell us what you need and our team will get back to you as soon as possible. We pride ourselves on concierge-level responsiveness.
              </p>
              <div className="mt-auto pt-10">
                <h3 className="text-[18px] font-semibold">Contacts us</h3>
                <ul className="mt-4 space-y-3 text-[14px] text-white/90 sm:text-[15px]">
                  <li className="flex items-center gap-2.5">
                    <MailIcon />
                    <span>contact@company.com</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <PhoneIcon />
                    <span>(414) 687 - 5892</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <LocationIcon />
                    <span>
                      794 Mcallister St
                      <br />
                      San Francisco, 94102
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </aside>

          <form noValidate onSubmit={handleSubmit} className="flex flex-col justify-center px-2 py-4 sm:px-4 sm:py-6 lg:px-6 lg:py-8">
            <div className="grid gap-4 sm:grid-cols-2 sm:gap-x-4 sm:gap-y-5">
              <div>
                <label htmlFor="contact-first-name" className="text-[13px] font-semibold text-[#1c1c1c]">
                  First Name
                </label>
                <input
                  id="contact-first-name"
                  value={values.firstName}
                  onChange={(event) => updateField("firstName", event.target.value)}
                  placeholder="Enter your first name"
                  aria-invalid={Boolean(errors.firstName)}
                  aria-describedby={errors.firstName ? "contact-first-name-error" : undefined}
                  className={fieldClass(Boolean(errors.firstName))}
                />
                {errors.firstName ? <p id="contact-first-name-error" className="mt-1.5 text-[11px] text-[#d52b35]">{errors.firstName}</p> : null}
              </div>
              <div>
                <label htmlFor="contact-last-name" className="text-[13px] font-semibold text-[#1c1c1c]">
                  Last Name
                </label>
                <input
                  id="contact-last-name"
                  value={values.lastName}
                  onChange={(event) => updateField("lastName", event.target.value)}
                  placeholder="Enter your last name"
                  aria-invalid={Boolean(errors.lastName)}
                  aria-describedby={errors.lastName ? "contact-last-name-error" : undefined}
                  className={fieldClass(Boolean(errors.lastName))}
                />
                {errors.lastName ? <p id="contact-last-name-error" className="mt-1.5 text-[11px] text-[#d52b35]">{errors.lastName}</p> : null}
              </div>
              <div>
                <label htmlFor="contact-email" className="text-[13px] font-semibold text-[#1c1c1c]">
                  Email Id
                </label>
                <input
                  id="contact-email"
                  type="email"
                  value={values.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder="Enter your email id"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "contact-email-error" : undefined}
                  className={fieldClass(Boolean(errors.email))}
                />
                {errors.email ? <p id="contact-email-error" className="mt-1.5 text-[11px] text-[#d52b35]">{errors.email}</p> : null}
              </div>
              <div>
                <label htmlFor="contact-phone" className="text-[13px] font-semibold text-[#1c1c1c]">
                  Phone Number
                </label>
                <div className={`relative mt-2 flex h-11 items-center rounded-[10px] border bg-white focus-within:border-navy focus-within:ring-2 focus-within:ring-navy/10 ${countryOpen ? "z-30" : ""} ${errors.phone ? "border-[#d52b35]" : "border-[#e4e9f0]"}`}>
                  <div ref={countryMenuRef} className="relative h-full shrink-0">
                    <button
                      type="button"
                      id="contact-country"
                      aria-haspopup="listbox"
                      aria-expanded={countryOpen}
                      aria-label={`${selectedCountry.name} (${selectedCountry.dial})`}
                      onClick={() => setCountryOpen((open) => !open)}
                      className="flex h-full cursor-pointer items-center gap-1.5 border-r border-[#e4e9f0] px-2.5 text-[13px] font-medium text-navy"
                    >
                      <CountryFlag id={selectedCountry.id} />
                      <span>({selectedCountry.dial})</span>
                      <svg viewBox="0 0 12 12" aria-hidden="true" className="h-3 w-3 text-[#8a99aa]">
                        <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                      </svg>
                    </button>
                    {countryOpen ? (
                      <ul role="listbox" aria-label="Country code" className="absolute left-0 top-[calc(100%+6px)] z-30 max-h-56 w-[8.5rem] overflow-auto rounded-[10px] border border-[#e4e9f0] bg-white py-1 shadow-[0_12px_30px_rgba(11,31,77,0.12)]">
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
                              className={`flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-[13px] font-medium text-navy ${country.id === selectedCountry.id ? "bg-[#f4f6fa]" : "hover:bg-[#f7f9fc]"}`}
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
                    id="contact-phone"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    value={values.phone}
                    onChange={(event) => updatePhone(event.target.value)}
                    placeholder={phonePlaceholder(selectedCountry.digits)}
                    aria-invalid={Boolean(errors.phone)}
                    aria-describedby={errors.phone ? "contact-phone-error" : undefined}
                    className="h-full min-w-0 flex-1 border-0 bg-transparent px-3 text-[14px] text-navy outline-none placeholder:text-[#c5ccd6]"
                  />
                </div>
                {errors.phone ? <p id="contact-phone-error" className="mt-1.5 text-[11px] text-[#d52b35]">{errors.phone}</p> : null}
              </div>
            </div>
            <div className="mt-5">
              <label htmlFor="contact-message" className="text-[13px] font-semibold text-[#1c1c1c]">
                Write your message
              </label>
              <textarea
                id="contact-message"
                value={values.message}
                onChange={(event) => updateField("message", event.target.value)}
                placeholder="Enter your message..."
                aria-invalid={Boolean(errors.message)}
                aria-describedby={errors.message ? "contact-message-error" : undefined}
                className={`${fieldClass(Boolean(errors.message))} h-[120px] resize-none py-3`}
              />
              {errors.message ? <p id="contact-message-error" className="mt-1.5 text-[11px] text-[#d52b35]">{errors.message}</p> : null}
            </div>
            <Button type="submit" size="lg" className="mt-6 h-12 w-fit cursor-pointer px-7 text-[15px]">
              Send Message →
            </Button>
            {submitted ? (
              <p role="status" className="mt-3 text-[14px] text-green-700">
                Thanks. We&apos;ll get back to you soon.
              </p>
            ) : null}
            <p className="mt-5 max-w-[28rem] font-[family-name:var(--font-manrope)] text-[12px] leading-[1.55] text-[#8a99aa]">
              By submitting this form, you agree to our{" "}
              <Link href={routes.privacy} className="underline">
                Privacy Policy
              </Link>{" "}
              and consent to having our team contact you regarding your request.
            </p>
          </form>
        </div>
      </Container>
    </main>
  );
}
