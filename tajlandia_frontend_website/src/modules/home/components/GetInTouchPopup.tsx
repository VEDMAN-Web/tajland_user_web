"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";

type Step = "intro" | "name" | "email" | "phone" | "message" | "success";
type FormValues = { firstName: string; lastName: string; email: string; phone: string; message: string };

const initialValues: FormValues = { firstName: "", lastName: "", email: "", phone: "", message: "" };

function CloseIcon() {
  return <span aria-hidden="true" className="text-[25px] font-light leading-none">×</span>;
}

export function GetInTouchPopup({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<Step>("intro");
  const [values, setValues] = useState<FormValues>(initialValues);
  const [error, setError] = useState("");

  function update(field: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setError("");
  }

  function continueStep(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step === "name") {
      const namePattern = /^[A-Za-z]+$/;
      if (!values.firstName.trim() || !values.lastName.trim()) {
        setError("Please enter both your first and last name.");
        return;
      }
      if (!namePattern.test(values.firstName) || !namePattern.test(values.lastName)) {
        setError("First Name and Last Name can contain letters only.");
        return;
      }
      setStep("email");
    } else if (step === "email") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
        setError("Please enter a valid email address.");
        return;
      }
      setStep("phone");
    } else if (step === "phone") {
      if (!/^\d{10}$/.test(values.phone)) {
        setError("Please enter a valid 10-digit Indian mobile number.");
        return;
      }
      setStep("message");
    } else if (step === "message") {
      if (values.message.replace(/[^A-Za-z]/g, "").length < 20) {
        setError("Please enter at least 20 letters in your message.");
        return;
      }
      setStep("success");
    }
  }

  function back() {
    setError("");
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#071536]/60 px-3 py-5 backdrop-blur-[3px] sm:px-6" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="get-in-touch-title" className="relative grid max-h-[calc(100svh-2.5rem)] w-full max-w-[760px] overflow-auto rounded-[20px] bg-white shadow-[0_20px_60px_rgba(11,31,77,0.22)] sm:grid-cols-[44%_56%] sm:overflow-hidden">
        <div className="relative hidden min-h-[430px] sm:block">
          <Image src="/images/home/get-in-touch.jpg" alt="Temple spires in Thailand" fill sizes="334px" className="object-cover" />
        </div>
        <div className="flex min-h-[430px] flex-col px-7 py-8 sm:px-9 sm:py-10">
          <button type="button" onClick={onClose} aria-label="Close Get In Touch popup" className="absolute right-5 top-4 flex h-8 w-8 items-center justify-center rounded-full text-[#c9cdd2] shadow-[0_2px_8px_rgba(11,31,77,0.08)] transition hover:text-navy"><CloseIcon /></button>
          {step !== "success" ? (
            <div>
              <p className="text-[9px] uppercase tracking-[0.12em] text-[#c4c7cc]">{content.eyebrow}</p>
              <h2 id="get-in-touch-title" className="mt-3 max-w-[370px] text-[24px] font-medium leading-[1.2] text-navy sm:text-[26px]">{content.title}</h2>
              <p className="mt-2 max-w-[390px] text-[12px] leading-[1.45] text-[#9da5af]">{content.description}</p>
            </div>
          ) : null}

          {step !== "intro" && step !== "success" ? (
            <form onSubmit={continueStep} className="mt-7" noValidate>
              {step === "name" ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-[12px] font-medium text-navy">First Name<input value={values.firstName} onChange={(event) => update("firstName", event.target.value)} placeholder="Enter your first name" className="mt-2 h-12 w-full rounded-[10px] border border-[#e5e7eb] px-3 text-[12px] font-normal outline-none focus:border-navy focus:ring-2 focus:ring-navy/10" /></label>
                  <label className="text-[12px] font-medium text-navy">Last Name<input value={values.lastName} onChange={(event) => update("lastName", event.target.value)} placeholder="Enter your last name" className="mt-2 h-12 w-full rounded-[10px] border border-[#e5e7eb] px-3 text-[12px] font-normal outline-none focus:border-navy focus:ring-2 focus:ring-navy/10" /></label>
                </div>
              ) : step === "email" ? (
                <label className="block text-[12px] font-medium text-navy">Email Id<input type="email" value={values.email} onChange={(event) => update("email", event.target.value)} placeholder="Enter your email id" className="mt-2 h-12 w-full rounded-[10px] border border-[#e5e7eb] px-3 text-[12px] font-normal outline-none focus:border-navy focus:ring-2 focus:ring-navy/10" /></label>
              ) : step === "phone" ? (
                <label className="block text-[12px] font-medium text-navy">Phone Number<input inputMode="numeric" value={values.phone ? `+91 ${values.phone}` : ""} onChange={(event) => update("phone", event.target.value.replace(/\D/g, "").replace(/^91/, "").slice(0, 10))} placeholder="+91 XXXX XXXXX" className="mt-2 h-12 w-full rounded-[10px] border border-[#e5e7eb] px-3 text-[12px] font-normal outline-none focus:border-navy focus:ring-2 focus:ring-navy/10" /></label>
              ) : (
                <label className="block text-[12px] font-medium text-navy">Write your message<textarea value={values.message} onChange={(event) => update("message", event.target.value)} placeholder="Enter your message..." rows={4} className="mt-2 w-full resize-none rounded-[10px] border border-[#e5e7eb] px-3 py-3 text-[12px] font-normal outline-none focus:border-navy focus:ring-2 focus:ring-navy/10" /></label>
              )}
              {error ? <p role="alert" className="mt-2 text-[11px] text-[#d52b35]">{error}</p> : null}
              <div className="mt-7 flex items-center justify-between border-t border-[#e5e7eb] pt-4">
                <button type="button" onClick={back} className="text-[11px] text-[#c7cbd0] hover:text-navy">← Back</button>
                <button type="submit" className="h-11 w-[112px] rounded-[10px] bg-navy text-[12px] text-white shadow-[0_3px_8px_rgba(11,31,77,0.16)]">Continue →</button>
              </div>
            </form>
          ) : null}

          {step === "intro" ? (
            <div className="mt-auto flex items-center justify-between border-t border-[#e5e7eb] pt-4">
              <button type="button" onClick={onClose} className="text-[11px] text-[#c7cbd0] hover:text-navy">Maybe later</button>
              <button type="button" onClick={() => setStep("name")} className="h-11 w-[112px] rounded-[10px] bg-navy text-[12px] text-white shadow-[0_3px_8px_rgba(11,31,77,0.16)]">Continue →</button>
            </div>
          ) : null}

          {step === "success" ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#c9e5f6] bg-[#eef8fd] text-[28px] text-navy">✓</div>
              <p className="mt-7 text-[9px] uppercase tracking-[0.12em] text-[#c4c7cc]">MESSAGE SENT</p>
              <h3 className="mt-3 text-[24px] font-medium leading-[1.2] text-navy">Thanks for reaching out.</h3>
              <p className="mt-2 max-w-[350px] text-[12px] leading-[1.45] text-[#9da5af]">We&apos;ve received your message and our team will get back to you within 24 hours.</p>
              <p className="mt-5 rounded-full border border-[#e5e7eb] bg-[#f8fafc] px-4 py-2 text-[11px] text-[#718096]"><span className="mr-2 text-green-500">●</span>Your enquiry has been submitted successfully.</p>
              <div className="mt-auto w-full border-t border-[#e5e7eb] pt-4 text-right">
                <button type="button" onClick={onClose} className="h-11 w-[170px] rounded-[10px] bg-navy text-[12px] text-white shadow-[0_3px_8px_rgba(11,31,77,0.16)]">Continue Exploring →</button>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
