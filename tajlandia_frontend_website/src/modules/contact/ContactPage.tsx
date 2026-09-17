"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";
import { Container } from "@/components/ui/Container";
import { routes } from "@/lib/constants/routes";

type FormValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message: string;
};

const initialValues: FormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  message: "",
};

function MailIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 shrink-0"><path d="M3 5.5h18v13H3zM4.8 7l7.2 5.2L19.2 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>;
}

function PhoneIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 shrink-0"><path d="M7.4 3.5 10 3l2 4.5-2.1 1.7c.8 1.8 2.1 3.1 3.9 3.9l1.7-2.1L20 13l-.5 2.6c-.3 1.5-1.6 2.5-3.1 2.4-6.6-.5-11.9-5.8-12.4-12.4-.1-1.5.9-2.8 2.4-3.1Z" fill="currentColor" /></svg>;
}

function LocationIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 shrink-0"><path d="M12 2.8a6.2 6.2 0 0 0-6.2 6.2c0 4.6 6.2 12.2 6.2 12.2s6.2-7.6 6.2-12.2A6.2 6.2 0 0 0 12 2.8Zm0 8.8a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z" fill="currentColor" /></svg>;
}

export function ContactPage({ inquiryOpen: initialInquiryOpen = false }: { inquiryOpen?: boolean }) {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [submitted, setSubmitted] = useState(false);
  const [inquiryOpen, setInquiryOpen] = useState(initialInquiryOpen);

  function closeInquiry() {
    window.history.replaceState({}, "", routes.contact);
    setInquiryOpen(false);
  }

  function updateField(field: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setSubmitted(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <main className="relative bg-white pt-12 sm:pt-14">
      <section>
        <Container>
          <div className="mx-auto max-w-[760px] text-center">
            <h1 className="font-display text-[56px] font-semibold italic leading-none tracking-[-0.04em] text-navy">
              Get in <span className="italic text-brand-red">Touch</span>
            </h1>
            <p className="mt-3 text-[24px] text-[#9aa3ad]">Choose the way that works best for you.</p>
          </div>

          <div className="mx-auto mt-10 grid w-full gap-8 rounded-[10px] bg-white p-2 shadow-[0_12px_45px_rgba(11,31,77,0.08)] sm:mt-11 sm:min-h-[667px] sm:grid-cols-[491px_1fr] sm:gap-10 sm:p-[9px]">
            <aside className="flex min-h-[420px] flex-col rounded-[15px] bg-[radial-gradient(ellipse_at_50%_100%,rgba(255,177,177,0.9),transparent_30%),linear-gradient(180deg,#061b4d_0%,#0b3478_42%,#467fc4_72%,#e8b7c6_100%)] px-6 py-7 text-white sm:h-[647px] sm:min-h-0 sm:w-[491px] sm:px-7 sm:py-9">
              <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-white/75">Send a message</p>
              <h2 className="mt-2 font-display text-[36px] font-medium leading-none">How can we help?</h2>
              <p className="mt-4 max-w-[390px] text-[16px] leading-[1.55] text-white/70">Tell us what you need and our team will get back to you as soon as possible. We pride ourselves on concierge-level responsiveness.</p>

              <div className="mt-auto">
                <h3 className="text-[20px] font-medium">Contacts us</h3>
                <ul className="mt-5 space-y-3 text-[18px] text-white/80">
                  <li className="flex items-center gap-2"><MailIcon /><span>contact@company.com</span></li>
                  <li className="flex items-center gap-2"><PhoneIcon /><span>(414) 687 - 5892</span></li>
                  <li className="flex items-start gap-2"><LocationIcon /><span>794 Mcallister St<br />San Francisco, 94102</span></li>
                </ul>
              </div>
            </aside>

            <form onSubmit={handleSubmit} className="flex flex-col justify-center px-3 py-7 sm:px-0 sm:pr-12">
              <div className="grid gap-4 sm:grid-cols-2 sm:gap-x-3 sm:gap-y-4">
                <label className="text-[11px] font-medium text-[#252525]">First Name<input required value={values.firstName} onChange={(event) => updateField("firstName", event.target.value)} placeholder="Enter your first name" className="mt-2 h-10 w-full rounded-[8px] border border-[#e5e7eb] px-3 text-[10px] font-normal outline-none placeholder:text-[#c9cdd2] focus:border-navy focus:ring-2 focus:ring-navy/10" /></label>
                <label className="text-[11px] font-medium text-[#252525]">Last Name<input required value={values.lastName} onChange={(event) => updateField("lastName", event.target.value)} placeholder="Enter your last name" className="mt-2 h-10 w-full rounded-[8px] border border-[#e5e7eb] px-3 text-[10px] font-normal outline-none placeholder:text-[#c9cdd2] focus:border-navy focus:ring-2 focus:ring-navy/10" /></label>
                <label className="text-[11px] font-medium text-[#252525]">Email Id<input required type="email" value={values.email} onChange={(event) => updateField("email", event.target.value)} placeholder="Enter your email id" className="mt-2 h-10 w-full rounded-[8px] border border-[#e5e7eb] px-3 text-[10px] font-normal outline-none placeholder:text-[#c9cdd2] focus:border-navy focus:ring-2 focus:ring-navy/10" /></label>
                <label className="text-[11px] font-medium text-[#252525]">Phone Number<input value={values.phone} onChange={(event) => updateField("phone", event.target.value)} placeholder="+91 XXXXXX XXXXX" className="mt-2 h-10 w-full rounded-[8px] border border-[#e5e7eb] px-3 text-[10px] font-normal outline-none placeholder:text-[#c9cdd2] focus:border-navy focus:ring-2 focus:ring-navy/10" /></label>
              </div>
              <label className="mt-4 text-[11px] font-medium text-[#252525]">Write your message<textarea required value={values.message} onChange={(event) => updateField("message", event.target.value)} placeholder="Enter your message..." className="mt-2 h-[98px] w-full resize-none rounded-[8px] border border-[#e5e7eb] px-3 py-3 text-[10px] font-normal outline-none placeholder:text-[#c9cdd2] focus:border-navy focus:ring-2 focus:ring-navy/10" /></label>
              <button type="submit" className="mt-4 h-10 w-[157px] rounded-full bg-navy text-[12px] text-white shadow-[0_3px_6px_rgba(11,31,77,0.18)]">Send Message →</button>
              {submitted ? <p role="status" className="mt-3 text-[10px] text-green-600">Thanks. We&apos;ll get back to you soon.</p> : null}
              <p className="mt-5 max-w-[360px] text-[8px] leading-[1.45] text-[#9da2a8]">By submitting this form, you agree to our <span className="underline">Privacy Policy</span> and consent to having our team contact you regarding your request.</p>
            </form>
          </div>
        </Container>
      </section>

      <div className="mt-14 h-36 bg-[#fbfcfd] gradient-contact-bg" aria-hidden="true" />

      {inquiryOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#dce3ef]/65 px-4 backdrop-blur-[3px]" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="inquiry-title" className="relative grid w-full max-w-[650px] overflow-hidden rounded-[20px] bg-white shadow-[0_20px_60px_rgba(11,31,77,0.18)] sm:grid-cols-[275px_1fr]">
            <div className="relative min-h-[260px] sm:min-h-[365px]">
              <Image src="/images/explore/chiang-mai.jpg" alt="Temple in Thailand" fill sizes="275px" className="object-cover" />
            </div>
            <div className="flex min-h-[365px] flex-col px-8 py-9 sm:px-8">
              <button type="button" onClick={closeInquiry} aria-label="Close inquiry" className="absolute right-5 top-4 flex h-7 w-7 items-center justify-center rounded-full text-[20px] text-[#c9cdd2] shadow-[0_2px_8px_rgba(11,31,77,0.08)] transition-colors hover:text-navy">×</button>
              <p className="text-[8px] uppercase tracking-[0.12em] text-[#c4c7cc]">Let&apos;s talk</p>
              <h2 id="inquiry-title" className="mt-3 max-w-[250px] text-[21px] font-medium leading-[1.25] text-navy">Have a question about Tajlandia?</h2>
              <p className="mt-2 max-w-[255px] text-[11px] leading-[1.45] text-[#a0a7b0]">Whether you&apos;re exploring a location, looking for a plot, or simply curious, we&apos;d love to hear from you.</p>
              <div className="mt-auto flex items-center justify-between gap-4 border-t border-[#e5e7eb] pt-3">
                <button type="button" onClick={closeInquiry} className="text-[10px] text-[#c7cbd0]">Maybe later</button>
                <button type="button" onClick={closeInquiry} className="h-[35px] w-[104px] rounded-[10px] bg-navy text-[11px] text-white shadow-[0_3px_8px_rgba(11,31,77,0.16)]">Continue →</button>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
