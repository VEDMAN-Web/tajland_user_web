"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { submitInquiryAction } from "@/lib/api/inquiries";
import { INQUIRY_EMAIL_MAX, INQUIRY_MESSAGE_MAX, inquiryMessageError, inquiryNameError } from "@/lib/api/inquiry.schema";
import { countryCodes, defaultCountry, findCountry, phonePlaceholder } from "@/lib/phone/countries";

type Step = "intro" | "name" | "email" | "phone" | "message" | "success";
type FormValues = { firstName: string; lastName: string; email: string; countryCode: string; phone: string; message: string };

const initialValues: FormValues = { firstName: "", lastName: "", email: "", countryCode: defaultCountry.id, phone: "", message: "" };

const labelClass = "block text-[13px] font-medium text-[#1a1a1a]";
const inputClass =
  "mt-2 h-11 w-full rounded-[10px] border border-[#e5e7eb] bg-white px-3.5 text-[13px] font-normal text-navy outline-none placeholder:text-[#9aa1ab] focus:border-navy focus:ring-2 focus:ring-navy/10";
const primaryButtonClass =
  "inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-[8px] bg-navy px-5 text-[13px] font-medium text-white shadow-[0_3px_8px_rgba(11,31,77,0.16)] transition hover:bg-navy-deep disabled:cursor-wait disabled:opacity-70";
const secondaryButtonClass = "cursor-pointer text-[12px] text-[#a3a9b1] transition hover:text-navy disabled:cursor-not-allowed";

function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3 w-3">
      <path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5">
      <path d="M3 8h10m0 0L9 4m4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={className}>
      <path d="m3.5 8.3 2.9 2.9 6.1-6.4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function GetInTouchPopup({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<Step>("intro");
  const [values, setValues] = useState<FormValues>(initialValues);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const countryMenuRef = useRef<HTMLDivElement>(null);
  const selectedCountry = findCountry(values.countryCode);
  // Skeleton until the side photo has loaded.
  const [imageLoaded, setImageLoaded] = useState(false);

  // While open: the page behind doesn't scroll, and Escape closes the popup.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      // The country list handles its own Escape first.
      if (event.key === "Escape" && !countryMenuRef.current?.querySelector("[role=listbox]")) onCloseRef.current();
    }
    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, []);

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

  function update(field: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setError("");
  }

  function updateCountry(countryId: string) {
    const country = findCountry(countryId);
    setValues((current) => ({ ...current, countryCode: country.id, phone: current.phone.slice(0, country.digits) }));
    setError("");
  }

  async function submit() {
    setIsSubmitting(true);
    const result = await submitInquiryAction({
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim(),
      phoneNumber: values.phone ? `${selectedCountry.dial}${values.phone}` : undefined,
      message: values.message.trim(),
    }).catch(() => ({ ok: false as const, message: "Unable to send your message right now. Please try again." }));
    setIsSubmitting(false);
    if (result.ok) setStep("success");
    else setError(result.message);
  }

  function continueStep(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    if (step === "name") {
      const nameError = inquiryNameError(values.firstName, "First name") ?? inquiryNameError(values.lastName, "Last name");
      if (nameError) {
        setError(nameError);
        return;
      }
      setStep("email");
    } else if (step === "email") {
      const email = values.email.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > INQUIRY_EMAIL_MAX) {
        setError("Please enter a valid email address.");
        return;
      }
      setStep("phone");
    } else if (step === "phone") {
      // Optional: leaving it empty skips it.
      if (values.phone && values.phone.length !== selectedCountry.digits) {
        setError(`Enter a ${selectedCountry.digits}-digit phone number, or leave it empty.`);
        return;
      }
      setCountryOpen(false);
      setStep("message");
    } else if (step === "message") {
      const messageError = inquiryMessageError(values.message);
      if (messageError) {
        setError(messageError);
        return;
      }
      void submit();
    }
  }

  function back() {
    if (isSubmitting) return;
    setError("");
    setCountryOpen(false);
    setStep(step === "message" ? "phone" : step === "phone" ? "email" : step === "email" ? "name" : "intro");
  }

  const content = {
    intro: {
      eyebrow: "LET’S TALK",
      title: <>Have a question about<br />Tajlandia?</>,
      description: "Whether you’re exploring a location, looking for a plot, or simply curious, we’d love to hear from you.",
    },
    name: {
      eyebrow: "NICE TO MEET YOU",
      title: <>What’s your name?</>,
      description: "Please introduce yourself so we know who we’re speaking with.",
    },
    email: {
      eyebrow: "STAY IN TOUCH",
      title: <>Where can we reach you?</>,
      description: "We’ll use this only to respond to your enquiry.",
    },
    phone: {
      eyebrow: "ONE MORE WAY TO REACH YOU",
      title: <>What’s your contact number?</>,
      description: "Useful for time sensitive updates or Whatsapp inquiry.",
    },
    message: {
      eyebrow: "HOW WE CAN HELP",
      title: <>Tell us little about what you’re<br className="hidden sm:block" /> looking for.</>,
      description: "Specify preferred province, zone, or general questions.",
    },
    success: {
      eyebrow: "MESSAGE SENT",
      title: <>Thanks for reaching out.</>,
      description: "We’ve received your message and our team will get back to you within 24 hours.",
    },
  }[step];

  // Rendered on <body>, so no page section (with its own stacking) can sit above it.
  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-[#071536]/60 px-3 py-5 backdrop-blur-[3px] sm:px-6"
      role="presentation"
      onClick={(event) => {
        // A click on the dimmed backdrop (outside the popup) closes it.
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section role="dialog" aria-modal="true" aria-labelledby="get-in-touch-title" className="relative grid max-h-[calc(100svh-2.5rem)] w-full max-w-[760px] overflow-auto rounded-[20px] bg-white font-manrope shadow-[0_20px_60px_rgba(11,31,77,0.22)] sm:grid-cols-[44%_56%] sm:overflow-hidden">
        {/* Photo inset in a light frame, as in Figma. */}
        <div className="hidden bg-[#f5f6f8] p-3 sm:block">
          <div className="relative h-full min-h-[406px] overflow-hidden rounded-[14px]">
            {!imageLoaded ? <span aria-hidden="true" className="absolute inset-0 animate-pulse bg-[#e6eaf0] motion-reduce:animate-none" /> : null}
            <Image src="/images/home/get-in-touch.jpg" alt="Temple spires in Thailand" fill sizes="310px" onLoad={() => setImageLoaded(true)} className={`object-cover transition-opacity duration-500 ${imageLoaded ? "opacity-100" : "opacity-0"}`} />
          </div>
        </div>
        <div className="flex min-h-[430px] flex-col px-7 py-8 sm:px-8 sm:py-10">
          <button type="button" onClick={onClose} aria-label="Close Get In Touch popup" className="absolute right-4 top-4 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-white text-[#9aa1ab] shadow-[0_2px_8px_rgba(11,31,77,0.12)] transition hover:text-navy"><CloseIcon /></button>
          {step !== "success" ? (
            <div className="pr-6">
              <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#b8bdc4]">{content.eyebrow}</p>
              <h2 id="get-in-touch-title" className="mt-2 max-w-[370px] text-[22px] font-bold leading-[1.25] tracking-[-0.01em] text-navy sm:text-[24px]">{content.title}</h2>
              <p className="mt-2 max-w-[330px] text-[12px] leading-[1.5] text-[#8b939e]">{content.description}</p>
            </div>
          ) : null}

          {step !== "intro" && step !== "success" ? (
            <form onSubmit={continueStep} className="mt-6 flex flex-1 flex-col" noValidate>
              {step === "name" ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className={labelClass}>First Name<input value={values.firstName} onChange={(event) => update("firstName", event.target.value)} placeholder="Enter your first name" className={inputClass} /></label>
                  <label className={labelClass}>Last Name<input value={values.lastName} onChange={(event) => update("lastName", event.target.value)} placeholder="Enter your last name" className={inputClass} /></label>
                </div>
              ) : step === "email" ? (
                <label className={labelClass}>Email Id<input type="email" value={values.email} onChange={(event) => update("email", event.target.value)} placeholder="Enter your email id" className={inputClass} /></label>
              ) : step === "phone" ? (
                <div>
                  <label htmlFor="get-in-touch-phone" className={labelClass}>
                    Phone Number <span className="font-normal text-[#9aa1ab]">(optional)</span>
                  </label>
                  {/* Same country picker as the contact page. */}
                  <div className={`relative mt-2 flex h-11 items-center rounded-[10px] border border-[#e5e7eb] bg-white focus-within:border-navy focus-within:ring-2 focus-within:ring-navy/10 ${countryOpen ? "z-30" : ""}`}>
                    <div ref={countryMenuRef} className="relative h-full shrink-0">
                      <button
                        type="button"
                        aria-haspopup="listbox"
                        aria-expanded={countryOpen}
                        aria-label={`${selectedCountry.name} (${selectedCountry.dial})`}
                        onClick={() => setCountryOpen((open) => !open)}
                        className="flex h-full cursor-pointer items-center gap-1.5 border-r border-[#e5e7eb] px-2.5 text-[13px] font-medium text-navy"
                      >
                        <CountryFlag id={selectedCountry.id} />
                        <span>({selectedCountry.dial})</span>
                        <svg viewBox="0 0 12 12" aria-hidden="true" className="h-3 w-3 text-[#8a99aa]">
                          <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                        </svg>
                      </button>
                      {countryOpen ? (
                        <ul role="listbox" aria-label="Country code" className="absolute left-0 top-[calc(100%+6px)] z-30 max-h-44 w-[8.5rem] overflow-auto rounded-[10px] border border-[#e5e7eb] bg-white py-1 shadow-[0_12px_30px_rgba(11,31,77,0.12)]">
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
                      id="get-in-touch-phone"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      value={values.phone}
                      onChange={(event) => update("phone", event.target.value.replace(/\D/g, "").slice(0, selectedCountry.digits))}
                      placeholder={phonePlaceholder(selectedCountry.digits)}
                      className="h-full min-w-0 flex-1 border-0 bg-transparent px-3 text-[13px] font-normal text-navy outline-none placeholder:text-[#9aa1ab]"
                    />
                  </div>
                </div>
              ) : (
                <label className={labelClass}>Write your message<textarea value={values.message} onChange={(event) => update("message", event.target.value)} placeholder="Enter your message..." rows={4} maxLength={INQUIRY_MESSAGE_MAX} className={`${inputClass} h-auto resize-none py-3`} /></label>
              )}
              {error ? <p role="alert" className="mt-2 text-[11px] text-[#d52b35]">{error}</p> : null}
              <div className="mt-auto flex items-center justify-between border-t border-[#eceef1] pt-4">
                <button type="button" onClick={back} disabled={isSubmitting} className={secondaryButtonClass}>← Back</button>
                <button type="submit" disabled={isSubmitting} aria-busy={isSubmitting} className={primaryButtonClass}>
                  {isSubmitting ? "Sending..." : step === "message" ? "Send Message" : "Continue"}
                  {isSubmitting ? null : <ArrowIcon />}
                </button>
              </div>
            </form>
          ) : null}

          {step === "intro" ? (
            <div className="mt-auto flex items-center justify-between border-t border-[#eceef1] pt-4">
              <button type="button" onClick={onClose} className={secondaryButtonClass}>Maybe later</button>
              <button type="button" onClick={() => setStep("name")} className={primaryButtonClass}>
                Continue
                <ArrowIcon />
              </button>
            </div>
          ) : null}

          {step === "success" ? (
            <div className="flex flex-1 flex-col items-center text-center">
              <div className="mt-6 flex h-11 w-11 items-center justify-center rounded-full border border-[#d5e5f5] bg-[#eaf2fb] text-navy">
                <CheckIcon className="h-4 w-4" />
              </div>
              <p className="mt-5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#b8bdc4]">{content.eyebrow}</p>
              <h3 id="get-in-touch-title" className="mt-2 text-[22px] font-bold leading-[1.25] tracking-[-0.01em] text-navy sm:text-[24px]">{content.title}</h3>
              <p className="mt-2 max-w-[330px] text-[12px] leading-[1.5] text-[#8b939e]">{content.description}</p>
              <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#e5e7eb] bg-[#f8fafc] px-3.5 py-1.5 text-[11px] text-[#5f6b78]">
                <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#22c55e] text-white">
                  <CheckIcon className="h-2.5 w-2.5" />
                </span>
                Your enquiry has been submitted successfully.
              </p>
              <div className="mt-auto flex w-full justify-end border-t border-[#eceef1] pt-4">
                <button type="button" onClick={onClose} className={primaryButtonClass}>
                  Continue Exploring
                  <ArrowIcon />
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>,
    document.body,
  );
}
