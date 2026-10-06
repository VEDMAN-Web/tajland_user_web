"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useId, useMemo, useState, type ReactNode } from "react";
import { isAbortError } from "@/lib/api/browser-client";
import { isApiError } from "@/lib/api/errors";
import { routes } from "@/lib/constants/routes";
import { useAuth } from "@/lib/hooks/useAuth";
import { logError } from "@/lib/logging/logger";
import { findCountry, splitStoredPhone } from "@/lib/phone/countries";
import { cn } from "@/lib/utils/cn";
import {
  CouponAppliedCard,
  CouponForm,
  fill,
  money,
  OrderSummaryCard,
  WarningIcon,
} from "./CartSummaryCard";
import { readAppliedCoupon, saveAppliedCoupon } from "./cart-coupon";
import { DashboardNavbar } from "./DashboardNavbar";
import { PhoneNumberInput } from "./PhoneNumberInput";
import { notifyCartChanged } from "@/lib/cart/cart-events";
import { OrderConfirmedDialog } from "./OrderConfirmedDialog";
import { PaymentStep, type PaymentSubmission } from "./PaymentStep";
import type { Order } from "./schemas/cart.schema";
import { useDashboardLanguage } from "./DashboardLanguageContext";
import { PageLoader } from "@/components/ui/PageLoader";
import type { CartSummary, CheckoutContact } from "./schemas/cart.schema";
import {
  createCheckout,
  getCartCoupons,
  getOrder,
  getOrderSummary,
  payOrderByCard,
} from "./services/cart.client";

type Translate = (source: string) => string;
type PurchaseType = "self" | "gift";
type ContactField = keyof CheckoutContact;
type Errors = Partial<Record<string, string>>;

const EMPTY_CONTACT: CheckoutContact = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
};
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Phone country before one is picked: Thailand, where the land is.
const DEFAULT_PHONE_COUNTRY = "TH";
const MESSAGE_MAX_LENGTH = 300;
// The summary column's button submits whichever step is showing, by form id.
const DETAILS_FORM_ID = "checkout-details";
const PAYMENT_FORM_ID = "checkout-payment";

/**
 * Required-field and format errors for one contact, keyed `${prefix}.${field}`.
 * `contact.phone` holds the national digits; `countryId` sets how many.
 */
function contactErrors(
  contact: CheckoutContact,
  prefix: string,
  countryId: string,
): Errors {
  const errors: Errors = {};
  if (!contact.firstName.trim())
    errors[`${prefix}.firstName`] = "First name is required.";
  if (!contact.lastName.trim()) errors[`${prefix}.lastName`] = "Last name is required.";
  if (!contact.email.trim()) errors[`${prefix}.email`] = "Email is required.";
  else if (!EMAIL_PATTERN.test(contact.email.trim()))
    errors[`${prefix}.email`] = "Enter a valid email address.";
  if (!contact.phone) errors[`${prefix}.phone`] = "Phone number is required.";
  else if (contact.phone.length !== findCountry(countryId).digits)
    errors[`${prefix}.phone`] = "Enter a {digits}-digit phone number.";
  return errors;
}

/** What `POST /checkout` gets: trimmed, with the phone as "+91" + its digits. */
const trimContact = (contact: CheckoutContact, countryId: string): CheckoutContact => ({
  firstName: contact.firstName.trim(),
  lastName: contact.lastName.trim(),
  email: contact.email.trim(),
  phone: `${findCountry(countryId).dial}${contact.phone}`,
});

export function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading, user } = useAuth();
  const { t } = useDashboardLanguage();

  // The coupon applied in the cart (by id); totals always come from the API.
  const [couponId, setCouponId] = useState(
    () => searchParams.get("couponId") ?? readAppliedCoupon()?.id ?? undefined,
  );
  const [summary, setSummary] = useState<
    | { status: "loading" }
    | { status: "ready"; data: CartSummary }
    | { status: "empty" }
    | { status: "error" }
  >({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);
  const [notice, setNotice] = useState("");

  const [purchaseType, setPurchaseType] = useState<PurchaseType>("self");
  // Buyer: the signed-in account's name / email, overridden by what's typed.
  const accountContact = useMemo<Partial<CheckoutContact>>(() => {
    if (!user) return {};
    const [firstName = "", ...rest] = (user.name ?? "").trim().split(/\s+/);
    return {
      firstName,
      lastName: rest.join(" "),
      email: user.email ?? "",
      phone: user.phone ? splitStoredPhone(user.phone).phone : "",
    };
  }, [user]);
  // The account phone's country (when it has one), else the default.
  const accountPhoneCountry = user?.phone
    ? splitStoredPhone(user.phone).countryCode
    : DEFAULT_PHONE_COUNTRY;
  const [buyerPhoneCountry, setBuyerPhoneCountry] = useState<string | null>(null);
  const buyerCountry = buyerPhoneCountry ?? accountPhoneCountry;
  const [recipientCountry, setRecipientCountry] = useState(DEFAULT_PHONE_COUNTRY);
  const [buyerEdits, setBuyerEdits] = useState<Partial<CheckoutContact>>({});
  const buyer: CheckoutContact = { ...EMPTY_CONTACT, ...accountContact, ...buyerEdits };
  // A gift is bought by the account holder: their details come from the account
  // (Figma hides "Your Information").
  const accountBuyer: CheckoutContact = { ...EMPTY_CONTACT, ...accountContact };

  // Discount code typed on this page (one applied in the cart arrives in the URL).
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [recipient, setRecipient] = useState<CheckoutContact>(EMPTY_CONTACT);
  const [personalMessage, setPersonalMessage] = useState("");
  const [sendDirectly, setSendDirectly] = useState(true);
  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  // Set once `POST /checkout` created the order: the page moves to payment.
  const [orderId, setOrderId] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  // The paid order, shown in the confirmation pop up.
  const [paidOrder, setPaidOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace(routes.login);
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const controller = new AbortController();
    getOrderSummary({ couponId, signal: controller.signal })
      // An empty cart answers 200 with zeros (older builds: 404, handled below).
      .then((data) =>
        setSummary(data.plots === 0 ? { status: "empty" } : { status: "ready", data }),
      )
      .catch((error: unknown) => {
        if (isAbortError(error)) return;
        if (isApiError(error) && error.code === "API_SESSION_EXPIRED") return;
        // The coupon no longer fits the cart: continue without it.
        if (
          couponId &&
          isApiError(error) &&
          (error.status === 400 || error.status === 404)
        ) {
          setNotice("Your discount code no longer applies to this cart.");
          setCouponId(undefined);
          saveAppliedCoupon(null);
          return;
        }
        // No plots in the cart: nothing to check out.
        if (isApiError(error) && error.status === 404) {
          setSummary({ status: "empty" });
          return;
        }
        logError(error, "Failed to load checkout summary");
        setSummary({ status: "error" });
      });

    return () => controller.abort();
  }, [isAuthenticated, couponId, reloadKey]);

  function removeCoupon() {
    setCouponId(undefined);
    saveAppliedCoupon(null);
    setCouponInput("");
    setCouponError("");
    setNotice("");
    router.replace(routes.checkout);
  }

  // Same as the cart: match the code in `GET /coupons`, then ask for the totals with its id.
  async function applyCoupon() {
    const code = couponInput.trim().toUpperCase();
    if (isApplyingCoupon || summary.status !== "ready") return;
    if (!code) {
      setCouponError("Enter a discount code.");
      return;
    }
    setCouponError("");
    setIsApplyingCoupon(true);
    try {
      const match = (await getCartCoupons()).find(
        (item) => item.code.toUpperCase() === code,
      );
      if (!match) {
        setCouponError("Invalid discount code.");
        return;
      }
      let data: CartSummary;
      try {
        data = await getOrderSummary({ couponId: match.id });
      } catch (error) {
        if (isApiError(error) && (error.status === 400 || error.status === 404)) {
          setCouponError("This code doesn't apply to your cart.");
          return;
        }
        throw error;
      }
      setSummary({ status: "ready", data });
      setCouponId(match.id);
      saveAppliedCoupon({ id: match.id, code: match.code });
      setNotice("");
      router.replace(`${routes.checkout}?${new URLSearchParams({ couponId: match.id })}`);
    } catch (error) {
      if (isApiError(error) && error.code === "API_SESSION_EXPIRED") return;
      logError(error, "Failed to apply coupon");
      setCouponError("Couldn't apply the code. Please try again.");
    } finally {
      setIsApplyingCoupon(false);
    }
  }

  function updateContact(
    setContact: (update: (current: CheckoutContact) => CheckoutContact) => void,
    prefix: string,
  ) {
    return (field: ContactField, value: string) => {
      setContact((current) => ({ ...current, [field]: value }));
      setErrors((current) => ({ ...current, [`${prefix}.${field}`]: undefined }));
    };
  }

  // Leaving the phone box: show its format error right away (an empty box waits for submit).
  function validatePhone(contact: CheckoutContact, prefix: string, countryId: string) {
    if (!contact.phone) return;
    const key = `${prefix}.phone`;
    setErrors((current) => ({
      ...current,
      [key]: contactErrors(contact, prefix, countryId)[key],
    }));
  }

  // A new country keeps only as many digits as it allows.
  function changeCountry(prefix: "buyer" | "recipient", countryId: string) {
    const max = findCountry(countryId).digits;
    if (prefix === "buyer") {
      setBuyerPhoneCountry(countryId);
      setBuyerEdits((edits) => ({ ...edits, phone: buyer.phone.slice(0, max) }));
    } else {
      setRecipientCountry(countryId);
      setRecipient((current) => ({ ...current, phone: current.phone.slice(0, max) }));
    }
    setErrors((current) => ({ ...current, [`${prefix}.phone`]: undefined }));
  }

  async function submit() {
    if (isSubmitting || summary.status !== "ready") return;
    const nextErrors: Errors =
      purchaseType === "gift"
        ? contactErrors(recipient, "recipient", recipientCountry)
        : contactErrors(buyer, "buyer", buyerCountry);
    setErrors(nextErrors);
    setSubmitError("");
    if (Object.values(nextErrors).some(Boolean)) {
      // Bring the first problem into view.
      document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      const id = await createCheckout({
        purchaseType,
        buyer:
          purchaseType === "gift"
            ? trimContact(accountBuyer, accountPhoneCountry)
            : trimContact(buyer, buyerCountry),
        ...(purchaseType === "gift"
          ? {
              recipient: {
                ...trimContact(recipient, recipientCountry),
                personalMessage: personalMessage.trim() || undefined,
                sendCertificateDirectly: sendDirectly,
              },
            }
          : {}),
        couponId,
      });
      setOrderId(id);
      // The coupon is used by this order.
      saveAppliedCoupon(null);
    } catch (error) {
      if (isApiError(error) && error.code === "API_SESSION_EXPIRED") return;
      const status = isApiError(error) ? error.status : 0;
      if (status === 409) {
        setSubmitError(
          "Some plots are no longer reserved for you. Please review your cart.",
        );
      } else if (status === 400 || status === 404) {
        setSubmitError(
          "Your cart changed and can't be checked out as it is. Please review your cart.",
        );
        setReloadKey((key) => key + 1);
      } else {
        logError(error, "Checkout failed");
        setSubmitError("Couldn't place your order. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  // `POST /payments` (card only for now), then the paid order for the confirmation.
  async function pay(payment: PaymentSubmission) {
    if (!orderId || isPaying || payment.method !== "card") return;
    setIsPaying(true);
    setSubmitError("");
    try {
      try {
        await payOrderByCard(orderId, payment.details);
      } catch (error) {
        // 409: not pending any more, most likely already paid (e.g. a retried click).
        if (!(isApiError(error) && error.status === 409)) throw error;
      }
      const order = await getOrder(orderId);
      if (order.status !== "paid") {
        setSubmitError(
          order.status === "expired"
            ? "Your order expired. Please check out again."
            : "Payment didn't go through. Please try again.",
        );
        return;
      }
      // Paid: the cart is now empty and the coupon used.
      saveAppliedCoupon(null);
      notifyCartChanged();
      setPaidOrder(order);
    } catch (error) {
      if (isApiError(error) && error.code === "API_SESSION_EXPIRED") return;
      if (isApiError(error) && error.status === 400) {
        setSubmitError("Your order expired. Please check out again.");
        return;
      }
      logError(error, "Payment failed");
      setSubmitError("Payment didn't go through. Please try again.");
    } finally {
      setIsPaying(false);
    }
  }

  if (isLoading) return <PageLoader label={t("Loading checkout...")} />;
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-[100svh] bg-[#f7f9fc] text-navy">
      <DashboardNavbar active="none" />
      <main className="mx-auto w-full max-w-[1240px] px-4 pb-16 pt-6 sm:px-8 sm:pt-8">
        <Link
          href={routes.cart}
          className="inline-flex items-center gap-1.5 font-manrope text-[13px] font-medium text-[#111111] hover:text-navy"
        >
          <span aria-hidden="true">←</span>
          {t("Back to Cart")}
        </Link>
        <h1 className="mt-3 font-manrope text-[26px] font-semibold leading-tight tracking-[-0.02em] text-[#111111] sm:text-[30px]">
          {t("Complete your purchase")}
        </h1>
        <p className="mt-1.5 font-manrope text-[13px] font-medium leading-5 text-[#8b939e] sm:text-[14px]">
          {t("You're just one step away from owning your piece of Thailand.")}
        </p>

        {summary.status === "loading" ? (
          <CheckoutSkeleton t={t} />
        ) : summary.status === "empty" ? (
          <StatusPanel
            message={t("Your cart is empty. Add plots before checking out.")}
            action={{ href: routes.dashboardExplore, label: t("Explore Thailand →") }}
          />
        ) : summary.status === "error" ? (
          <StatusPanel
            message={t("Couldn't load your order summary.")}
            onRetry={() => {
              setSummary({ status: "loading" });
              setReloadKey((key) => key + 1);
            }}
            retryLabel={t("Try Again")}
          />
        ) : (
          <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            {orderId ? (
              <PaymentStep
                formId={PAYMENT_FORM_ID}
                disabled={isPaying || Boolean(paidOrder)}
                onSubmit={pay}
                t={t}
              />
            ) : (
              <form
                id={DETAILS_FORM_ID}
                noValidate
                onSubmit={(event) => {
                  event.preventDefault();
                  void submit();
                }}
                className="space-y-4"
              >
                <Card>
                  <h2 className="font-manrope text-[18px] font-semibold text-[#111111] sm:text-[20px]">
                    {t("Who is this purchase for?")}
                  </h2>
                  <div
                    role="radiogroup"
                    aria-label={t("Who is this purchase for?")}
                    className="mt-4 grid grid-cols-2 gap-3"
                  >
                    <PurchaseTypeOption
                      selected={purchaseType === "self"}
                      onSelect={() => setPurchaseType("self")}
                      icon={<UserIcon />}
                      label={t("My Self")}
                    />
                    <PurchaseTypeOption
                      selected={purchaseType === "gift"}
                      onSelect={() => setPurchaseType("gift")}
                      icon={<GiftIcon />}
                      label={t("Someone else")}
                    />
                  </div>
                </Card>

                {purchaseType === "self" ? (
                  <Card>
                    <h2 className="font-manrope text-[18px] font-semibold text-[#111111] sm:text-[20px]">
                      {t("Your Information")}
                    </h2>
                    <ContactFields
                      prefix="buyer"
                      contact={buyer}
                      errors={errors}
                      onChange={updateContact(
                        (update) =>
                          setBuyerEdits((edits) => update({ ...buyer, ...edits })),
                        "buyer",
                      )}
                      phoneCountry={buyerCountry}
                      onPhoneCountryChange={(id) => changeCountry("buyer", id)}
                      onPhoneBlur={() => validatePhone(buyer, "buyer", buyerCountry)}
                      t={t}
                    />
                  </Card>
                ) : null}

                {purchaseType === "gift" ? (
                  // Figma "Gift this collection": the recipient, with a pink accent edge.
                  <Card className="border-l-4 border-l-[#f6c4c4]">
                    <h2 className="font-manrope text-[18px] font-semibold text-[#111111] sm:text-[20px]">
                      {t("Gift this collection")}
                    </h2>
                    <ContactFields
                      prefix="recipient"
                      contact={recipient}
                      errors={errors}
                      onChange={updateContact(setRecipient, "recipient")}
                      phoneCountry={recipientCountry}
                      onPhoneCountryChange={(id) => changeCountry("recipient", id)}
                      onPhoneBlur={() =>
                        validatePhone(recipient, "recipient", recipientCountry)
                      }
                      t={t}
                    />
                    <Field label={t("Personal Message")} htmlFor="recipient-message">
                      <textarea
                        id="recipient-message"
                        value={personalMessage}
                        maxLength={MESSAGE_MAX_LENGTH}
                        onChange={(event) => setPersonalMessage(event.target.value)}
                        placeholder={t("Write your personal message...")}
                        rows={3}
                        className={cn(inputClass(false), "h-auto resize-none py-3")}
                      />
                    </Field>
                    <label className="mt-4 inline-flex cursor-pointer items-center gap-2 font-manrope text-[13px] font-medium text-navy">
                      <input
                        type="checkbox"
                        checked={sendDirectly}
                        onChange={(event) => setSendDirectly(event.target.checked)}
                        className="h-4 w-4 cursor-pointer accent-[#001f54]"
                      />
                      {t("Send certificate to recipient directly")}
                    </label>
                  </Card>
                ) : null}
              </form>
            )}

            <aside className="space-y-3">
              {notice ? (
                <p
                  role="status"
                  className="flex items-center gap-1.5 font-manrope text-[12px] font-medium text-[#b45309]"
                >
                  <WarningIcon />
                  {t(notice)}
                </p>
              ) : null}
              {orderId ? (
                // The order is created with its discount, so the code is locked now.
                summary.data.coupon ? (
                  <CouponAppliedCard
                    code={summary.data.coupon.code}
                    discount={summary.data.discount}
                    t={t}
                  />
                ) : null
              ) : (
                <CouponForm
                  coupon={{
                    input: couponInput,
                    applied: summary.data.coupon
                      ? { id: summary.data.coupon.id, code: summary.data.coupon.code }
                      : null,
                    error: couponError,
                    isApplying: isApplyingCoupon,
                    onInput: (value) => {
                      setCouponInput(value);
                      setCouponError("");
                    },
                    onApply: () => void applyCoupon(),
                    onRemove: removeCoupon,
                  }}
                  discount={summary.data.discount}
                  t={t}
                />
              )}
              <OrderSummaryCard summary={summary.data} t={t}>
                {submitError ? (
                  <p
                    role="alert"
                    className="mt-5 flex items-start gap-1.5 font-manrope text-[12px] font-medium leading-4 text-[#e11d2e]"
                  >
                    <WarningIcon />
                    <span>
                      {t(submitError)}{" "}
                      <Link href={routes.cart} className="underline">
                        {t("Back to Cart")}
                      </Link>
                    </span>
                  </p>
                ) : null}
                <button
                  type="submit"
                  form={orderId ? PAYMENT_FORM_ID : DETAILS_FORM_ID}
                  disabled={
                    isSubmitting ||
                    isPaying ||
                    Boolean(paidOrder) ||
                    !summary.data.checkoutEligible
                  }
                  className="mt-6 h-12 w-full cursor-pointer rounded-[12px] bg-navy font-manrope text-[15px] font-medium text-white hover:bg-navy-deep disabled:cursor-not-allowed disabled:bg-[#d9dde3] disabled:text-[#9aa3ad]"
                >
                  {isPaying ? (
                    <span className="inline-flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white"
                      />
                      {t("Processing Payment...")}
                    </span>
                  ) : orderId ? (
                    `${t("Pay")} ${money(summary.data.total)}`
                  ) : isSubmitting ? (
                    t("Confirming...")
                  ) : (
                    t("Confirm Checkout")
                  )}
                </button>
                <Link
                  href={routes.dashboardExplore}
                  className="mt-3 flex h-12 items-center justify-center rounded-[12px] border border-[#e4e9ef] bg-white font-manrope text-[15px] font-medium text-[#111111] hover:border-[#cfd8e3]"
                >
                  {t("Continue Exploring")}
                </Link>
                {!summary.data.checkoutEligible ? (
                  <p className="mt-3 text-center font-manrope text-[11px] font-medium text-[#e11d2e]">
                    {t("Your cart doesn't meet the minimum yet.")}{" "}
                    <Link href={routes.cart} className="underline">
                      {t("Back to Cart")}
                    </Link>
                  </p>
                ) : null}
              </OrderSummaryCard>
            </aside>
          </div>
        )}
      </main>

      {paidOrder ? (
        <OrderConfirmedDialog
          order={paidOrder}
          onClose={() => router.push(routes.land)}
          t={t}
        />
      ) : null}
    </div>
  );
}

function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={cn(
        "rounded-[16px] border border-[#eef1f4] bg-white px-5 py-5 shadow-[0_8px_24px_rgba(11,31,77,0.05)] sm:px-7 sm:py-6",
        className,
      )}
    >
      {children}
    </section>
  );
}

function PurchaseTypeOption({
  selected,
  onSelect,
  icon,
  label,
}: {
  selected: boolean;
  onSelect: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "flex h-12 cursor-pointer items-center justify-center gap-2 rounded-[10px] border font-manrope text-[13px] font-medium transition-colors",
        selected
          ? "border-navy bg-[#f7f9fc] text-navy"
          : "border-[#e4e9ef] bg-white text-[#6b7280] hover:border-[#cfd8e3]",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

const inputClass = (invalid: boolean) =>
  cn(
    "h-12 w-full rounded-[10px] border bg-white px-4 font-manrope text-[14px] font-medium text-navy outline-none placeholder:text-[#b0b7c0]",
    invalid ? "border-[#e11d2e] bg-[#fff5f5]" : "border-[#e4e9ef] focus:border-navy",
  );

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-4 min-w-0">
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block font-manrope text-[12px] font-semibold text-[#111111]"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p
          id={`${htmlFor}-error`}
          className="mt-1 font-manrope text-[11px] font-medium text-[#e11d2e]"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

function ContactFields({
  prefix,
  contact,
  errors,
  onChange,
  phoneCountry,
  onPhoneCountryChange,
  onPhoneBlur,
  t,
}: {
  prefix: string;
  contact: CheckoutContact;
  errors: Errors;
  onChange: (field: ContactField, value: string) => void;
  phoneCountry: string;
  onPhoneCountryChange: (countryId: string) => void;
  onPhoneBlur: () => void;
  t: Translate;
}) {
  const baseId = useId();

  function input(
    field: ContactField,
    props: { type: string; placeholder: string; autoComplete: string },
  ) {
    const id = `${baseId}-${field}`;
    const error = errors[`${prefix}.${field}`];
    return (
      <input
        id={id}
        type={props.type}
        value={contact[field]}
        onChange={(event) => onChange(field, event.target.value)}
        placeholder={props.placeholder}
        autoComplete={prefix === "buyer" ? props.autoComplete : "off"}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={inputClass(Boolean(error))}
      />
    );
  }

  const fieldError = (field: ContactField) => {
    const error = errors[`${prefix}.${field}`];
    return error
      ? fill(t(error), { digits: findCountry(phoneCountry).digits })
      : undefined;
  };
  const phoneError = fieldError("phone");

  return (
    <>
      <div className="grid gap-x-4 sm:grid-cols-2">
        <Field
          label={`${t("First Name")}*`}
          htmlFor={`${baseId}-firstName`}
          error={fieldError("firstName")}
        >
          {input("firstName", {
            type: "text",
            placeholder: t("Enter your first name"),
            autoComplete: "given-name",
          })}
        </Field>
        <Field
          label={`${t("Last name")}*`}
          htmlFor={`${baseId}-lastName`}
          error={fieldError("lastName")}
        >
          {input("lastName", {
            type: "text",
            placeholder: t("Enter your last name"),
            autoComplete: "family-name",
          })}
        </Field>
      </div>
      <Field
        label={`${t("Email Address")}*`}
        htmlFor={`${baseId}-email`}
        error={fieldError("email")}
      >
        {input("email", {
          type: "email",
          placeholder: t("Enter your email"),
          autoComplete: "email",
        })}
      </Field>
      <Field
        label={`${t("Phone Number")}*`}
        htmlFor={`${baseId}-phone`}
        error={phoneError}
      >
        <PhoneNumberInput
          id={`${baseId}-phone`}
          countryId={phoneCountry}
          digits={contact.phone}
          invalid={Boolean(phoneError)}
          describedBy={phoneError ? `${baseId}-phone-error` : undefined}
          autoComplete={prefix === "buyer" ? "tel-national" : "off"}
          label={t("Phone Number")}
          onCountryChange={onPhoneCountryChange}
          onDigitsChange={(digits) => onChange("phone", digits)}
          onBlur={onPhoneBlur}
        />
      </Field>
    </>
  );
}

function StatusPanel({
  message,
  action,
  onRetry,
  retryLabel,
}: {
  message: string;
  action?: { href: string; label: string };
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div
      role="alert"
      className="mt-6 flex flex-col items-center gap-3 rounded-[16px] border border-[#eef1f4] bg-white px-4 py-12 text-center"
    >
      <p className="font-manrope text-[14px] font-medium text-[#8b939e]">{message}</p>
      {action ? (
        <Link
          href={action.href}
          className="inline-flex h-10 items-center rounded-[10px] bg-navy px-4 font-manrope text-[13px] font-medium text-white hover:bg-navy-deep"
        >
          {action.label}
        </Link>
      ) : null}
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="h-9 cursor-pointer rounded-[8px] border border-navy px-4 font-manrope text-[13px] font-semibold text-navy hover:bg-[#f5f7fa]"
        >
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}

const bone = "animate-pulse rounded-[8px] bg-[#eef1f5] motion-reduce:animate-none";

// Order Summary skeleton rows (label / value widths), in the card's divided groups.
const SUMMARY_SKELETON_GROUPS = [
  [
    ["w-16", "w-6"],
    ["w-20", "w-8"],
  ],
  [
    ["w-24", "w-14"],
    ["w-28", "w-14"],
    ["w-28", "w-14"],
  ],
  [
    ["w-20", "w-16"],
    ["w-28", "w-14"],
  ],
];

// A label over an input, as in `ContactFields`.
function FieldSkeleton({ label }: { label: string }) {
  return (
    <div className="mt-4 min-w-0">
      <span className={cn(bone, "mb-2 block h-3", label)} />
      <span className={cn(bone, "block h-12 rounded-[10px]")} />
    </div>
  );
}

/** The checkout layout with its real headings while the summary loads. */
function CheckoutSkeleton({ t }: { t: Translate }) {
  return (
    <div
      aria-busy="true"
      className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]"
    >
      <div className="space-y-4">
        <Card>
          <h2 className="font-manrope text-[18px] font-semibold text-[#111111] sm:text-[20px]">
            {t("Who is this purchase for?")}
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <span className={cn(bone, "block h-11 rounded-[10px]")} />
            <span className={cn(bone, "block h-11 rounded-[10px]")} />
          </div>
        </Card>
        <Card>
          <h2 className="font-manrope text-[18px] font-semibold text-[#111111] sm:text-[20px]">
            {t("Your Information")}
          </h2>
          <div className="grid gap-x-4 sm:grid-cols-2">
            <FieldSkeleton label="w-20" />
            <FieldSkeleton label="w-20" />
          </div>
          <FieldSkeleton label="w-24" />
          <FieldSkeleton label="w-24" />
        </Card>
      </div>
      <aside className="rounded-[16px] border border-[#eef1f4] bg-white px-5 py-6 shadow-[0_8px_24px_rgba(11,31,77,0.05)] sm:px-7 sm:py-7">
        <h2 className="font-manrope text-[22px] font-semibold leading-none text-[#111111] sm:text-[24px]">
          {t("Order Summary")}
        </h2>
        <div className="mt-5 divide-y divide-[#e5e7eb]">
          {SUMMARY_SKELETON_GROUPS.map((rows, groupIndex) => (
            <div key={groupIndex} className="space-y-3.5 py-4 first:pt-0">
              {rows.map(([label, value], rowIndex) => (
                <div key={rowIndex} className="flex items-center justify-between">
                  <span className={cn(bone, "block h-4", label)} />
                  <span className={cn(bone, "block h-4", value)} />
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-[#e5e7eb] pt-5">
          <span className={cn(bone, "block h-4 w-12")} />
          <span className={cn(bone, "block h-8 w-28")} />
        </div>
        <span className={cn(bone, "mt-5 block h-14 rounded-[12px]")} />
        <span className={cn(bone, "mt-5 block h-12 rounded-[12px]")} />
      </aside>
    </div>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5">
      <circle cx="8" cy="5" r="3" fill="currentColor" />
      <path d="M2.5 14c0-3 2.5-5 5.5-5s5.5 2 5.5 5Z" fill="currentColor" />
    </svg>
  );
}

function GiftIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5">
      <path
        d="M2.5 7h11v7h-11zM1.5 4.5h13V7h-13zM8 4.5V14M8 4.5C6.5 2 4 2.3 4.5 4.5M8 4.5C9.5 2 12 2.3 11.5 4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}
