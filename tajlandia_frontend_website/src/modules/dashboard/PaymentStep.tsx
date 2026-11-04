"use client";

import { useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type Translate = (source: string) => string;

export type PaymentMethod = "card" | "apple_pay" | "google_pay";

/**
 * What `POST /payments` may receive for a card. Only safe fields: the API
 * rejects a full card number or CVC, so those never leave this form.
 */
export type CardPaymentDetails = {
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  holderName: string;
  country: string;
};

export type PaymentSubmission =
  | { method: "card"; details: CardPaymentDetails }
  | { method: "apple_pay" | "google_pay" };

type CardFields = {
  holderName: string;
  number: string;
  expiry: string;
  cvc: string;
  country: string;
};

type CardErrors = Partial<Record<keyof CardFields, string>>;

const digitsOnly = (value: string) => value.replace(/\D/g, "");
// Visa / Mastercard numbers are 16 digits.
const CARD_NUMBER_DIGITS = 16;

/** "4242424242424242" -> "4242 4242 4242 4242" (at most 16 digits). */
const formatCardNumber = (value: string) =>
  digitsOnly(value)
    .slice(0, CARD_NUMBER_DIGITS)
    .replace(/(\d{4})(?=\d)/g, "$1 ");

/** "1228" -> "12 / 28". */
function formatExpiry(value: string) {
  const digits = digitsOnly(value).slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)} / ${digits.slice(2)}` : digits;
}

/** Standard card checksum, so a mistyped number is caught before paying. */
function passesLuhn(number: string) {
  let sum = 0;
  let double = false;
  for (let index = number.length - 1; index >= 0; index -= 1) {
    let digit = Number(number[index]);
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    double = !double;
  }
  return sum % 10 === 0;
}

export function cardBrand(number: string) {
  const digits = digitsOnly(number);
  if (/^4/.test(digits)) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(digits)) return "mastercard";
  if (/^3[47]/.test(digits)) return "amex";
  return "card";
}

function validateCard(fields: CardFields, now = new Date()): CardErrors {
  const errors: CardErrors = {};
  if (!fields.holderName.trim()) errors.holderName = "Cardholder name is required.";

  const number = digitsOnly(fields.number);
  if (!number) errors.number = "Card number is required.";
  else if (number.length !== CARD_NUMBER_DIGITS)
    errors.number = "Card number must be 16 digits.";
  else if (!passesLuhn(number)) errors.number = "Enter a valid card number.";

  const [month, year] = [
    Number(digitsOnly(fields.expiry).slice(0, 2)),
    Number(digitsOnly(fields.expiry).slice(2, 4)),
  ];
  if (!fields.expiry.trim()) errors.expiry = "Expiration date is required.";
  else if (digitsOnly(fields.expiry).length !== 4 || month < 1 || month > 12)
    errors.expiry = "Use MM / YY.";
  else {
    // Valid through the end of its month.
    const expiresAt = new Date(2000 + year, month, 1);
    if (expiresAt <= now) errors.expiry = "This card has expired.";
  }

  const cvc = digitsOnly(fields.cvc);
  if (!cvc) errors.cvc = "CVC is required.";
  else if (cvc.length !== 3) errors.cvc = "CVC must be 3 digits.";

  if (!fields.country.trim()) errors.country = "Billing country is required.";
  return errors;
}

/**
 * Figma "Payment Method" + "Card Details" (checkout step 2, after
 * `POST /checkout` created the order). The Pay button lives in the summary
 * column and submits this form through its `id`.
 */
export function PaymentStep({
  formId,
  disabled,
  onSubmit,
  t,
}: {
  formId: string;
  disabled: boolean;
  onSubmit: (payment: PaymentSubmission) => void;
  t: Translate;
}) {
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [fields, setFields] = useState<CardFields>({
    holderName: "",
    number: "",
    expiry: "",
    cvc: "",
    country: "",
  });
  const [errors, setErrors] = useState<CardErrors>({});
  const baseId = useId();

  function update(field: keyof CardFields, value: string) {
    setFields((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  return (
    <form
      id={formId}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (disabled) return;
        if (method !== "card") {
          onSubmit({ method });
          return;
        }
        const nextErrors = validateCard(fields);
        setErrors(nextErrors);
        if (Object.values(nextErrors).some(Boolean)) {
          document
            .querySelector<HTMLElement>(`#${CSS.escape(formId)} [aria-invalid='true']`)
            ?.focus();
          return;
        }
        const number = digitsOnly(fields.number);
        const expiry = digitsOnly(fields.expiry);
        onSubmit({
          method: "card",
          details: {
            brand: cardBrand(number),
            last4: number.slice(-4),
            expMonth: Number(expiry.slice(0, 2)),
            expYear: 2000 + Number(expiry.slice(2, 4)),
            holderName: fields.holderName.trim(),
            country: fields.country.trim(),
          },
        });
      }}
      className="space-y-4"
    >
      <Card>
        <h2 className="font-manrope text-[18px] font-semibold text-[#111111] sm:text-[20px]">
          {t("Payment Method")}
        </h2>
        <div
          role="radiogroup"
          aria-label={t("Payment Method")}
          className="mt-4 grid gap-3 sm:grid-cols-3"
        >
          <MethodOption
            selected={method === "card"}
            onSelect={() => setMethod("card")}
            label={t("Card")}
            hint={<CardBrands />}
          />
          {/* Only card payments work for now; the wallets show as unavailable. */}
          <MethodOption
            selected={method === "apple_pay"}
            unavailable
            onSelect={() => setMethod("apple_pay")}
            label={t("Apple Pay")}
            hint={t("Touch ID / Face ID")}
          />
          <MethodOption
            selected={method === "google_pay"}
            unavailable
            onSelect={() => setMethod("google_pay")}
            label={t("Google Pay")}
            hint={t("Fast Checkout")}
          />
        </div>
      </Card>

      {method === "card" ? (
        <Card>
          <h2 className="font-manrope text-[18px] font-semibold text-[#111111] sm:text-[20px]">
            {t("Card Details")}
          </h2>
          <Field
            id={`${baseId}-name`}
            label={t("Cardholder Name")}
            error={errors.holderName && t(errors.holderName)}
          >
            <input
              id={`${baseId}-name`}
              value={fields.holderName}
              onChange={(event) => update("holderName", event.target.value)}
              placeholder={t("Name on card")}
              autoComplete="cc-name"
              aria-invalid={Boolean(errors.holderName)}
              className={inputClass(Boolean(errors.holderName))}
            />
          </Field>
          <Field
            id={`${baseId}-number`}
            label={t("Card Number")}
            error={errors.number && t(errors.number)}
          >
            <input
              id={`${baseId}-number`}
              value={fields.number}
              onChange={(event) => update("number", formatCardNumber(event.target.value))}
              placeholder="1234 5678 9012 3456"
              inputMode="numeric"
              autoComplete="cc-number"
              aria-invalid={Boolean(errors.number)}
              className={inputClass(Boolean(errors.number))}
            />
          </Field>
          <div className="grid gap-x-4 sm:grid-cols-2">
            <Field
              id={`${baseId}-expiry`}
              label={t("Expiration Date")}
              error={errors.expiry && t(errors.expiry)}
            >
              <input
                id={`${baseId}-expiry`}
                value={fields.expiry}
                onChange={(event) => update("expiry", formatExpiry(event.target.value))}
                placeholder="MM / YY"
                inputMode="numeric"
                autoComplete="cc-exp"
                aria-invalid={Boolean(errors.expiry)}
                className={inputClass(Boolean(errors.expiry))}
              />
            </Field>
            <Field
              id={`${baseId}-cvc`}
              label={t("CVC")}
              error={errors.cvc && t(errors.cvc)}
            >
              <input
                id={`${baseId}-cvc`}
                value={fields.cvc}
                onChange={(event) =>
                  update("cvc", digitsOnly(event.target.value).slice(0, 3))
                }
                placeholder="123"
                inputMode="numeric"
                autoComplete="cc-csc"
                aria-invalid={Boolean(errors.cvc)}
                className={inputClass(Boolean(errors.cvc))}
              />
            </Field>
          </div>
          <Field
            id={`${baseId}-country`}
            label={t("Billing Country")}
            error={errors.country && t(errors.country)}
          >
            <input
              id={`${baseId}-country`}
              value={fields.country}
              onChange={(event) => update("country", event.target.value)}
              placeholder={t("Enter your country")}
              autoComplete="country-name"
              aria-invalid={Boolean(errors.country)}
              className={inputClass(Boolean(errors.country))}
            />
          </Field>
        </Card>
      ) : null}
    </form>
  );
}

function Card({ children }: { children: ReactNode }) {
  return (
    <section className="rounded-[16px] border border-[#eef1f4] bg-white px-5 py-5 shadow-[0_2px_8px_rgba(0,0,0,0.08)] sm:px-8 sm:py-7">
      {children}
    </section>
  );
}

function MethodOption({
  selected,
  unavailable = false,
  onSelect,
  label,
  hint,
}: {
  selected: boolean;
  unavailable?: boolean;
  onSelect: () => void;
  label: string;
  hint: ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={unavailable}
      onClick={onSelect}
      className={cn(
        "flex min-h-[64px] cursor-pointer flex-col disabled:cursor-not-allowed disabled:opacity-50 items-center justify-center gap-1 rounded-[10px] border px-3 py-2.5 font-manrope transition-colors",
        selected
          ? "border-navy bg-[#f7f9fc] text-navy"
          : "border-[#e4e9ef] bg-white text-[#6b7280] hover:border-[#cfd8e3]",
      )}
    >
      <span className="flex items-center gap-2 text-[13px] font-medium">
        <span
          aria-hidden="true"
          className={cn(
            "flex h-4 w-4 items-center justify-center rounded-full border",
            selected ? "border-navy" : "border-[#c4c9cf]",
          )}
        >
          {selected ? <span className="h-2 w-2 rounded-full bg-navy" /> : null}
        </span>
        {label}
      </span>
      <span className="text-[10px] font-medium text-[#8b939e]">{hint}</span>
    </button>
  );
}

function CardBrands() {
  return (
    <span className="flex items-center gap-1.5 font-bold italic">
      <span className="text-[#1a1f71]">VISA</span>
      <span className="text-[#eb001b]">MC</span>
    </span>
  );
}

const inputClass = (invalid: boolean) =>
  cn(
    "h-12 w-full rounded-[10px] border bg-white px-4 font-manrope text-[14px] font-medium text-navy outline-none placeholder:text-[#b0b7c0]",
    invalid ? "border-[#e11d2e] bg-[#fff5f5]" : "border-[#e4e9ef] focus:border-navy",
  );

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-4 min-w-0">
      <label
        htmlFor={id}
        className="mb-1.5 block font-manrope text-[12px] font-semibold text-[#111111]"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1 font-manrope text-[11px] font-medium text-[#e11d2e]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
