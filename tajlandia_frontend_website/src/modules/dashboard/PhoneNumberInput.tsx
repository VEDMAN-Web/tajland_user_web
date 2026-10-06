"use client";

import { useEffect, useRef, useState } from "react";
import { CountryFlag } from "@/components/ui/CountryFlag";
import { countryCodes, findCountry, phonePlaceholder } from "@/lib/phone/countries";
import { cn } from "@/lib/utils/cn";

/**
 * Phone field with a country picker (flag + dial code), as on Edit Profile.
 * Takes digits only, at most the picked country's length.
 */
export function PhoneNumberInput({
  id,
  countryId,
  digits,
  invalid,
  describedBy,
  autoComplete,
  label,
  onCountryChange,
  onDigitsChange,
  onBlur,
}: {
  id: string;
  countryId: string;
  /** National number, digits only. */
  digits: string;
  invalid: boolean;
  describedBy?: string;
  autoComplete: string;
  /** Accessible name for the country list. */
  label: string;
  onCountryChange: (countryId: string) => void;
  onDigitsChange: (digits: string) => void;
  onBlur?: () => void;
}) {
  const country = findCountry(countryId);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointer(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("pointerdown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div
      className={cn(
        "relative flex h-12 items-center rounded-[10px] border bg-white focus-within:border-navy",
        open && "z-30",
        invalid
          ? "border-[#e11d2e] bg-[#fff5f5] focus-within:border-[#e11d2e]"
          : "border-[#e4e9ef]",
      )}
    >
      <div ref={menuRef} className="relative h-full shrink-0">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={`${country.name} (${country.dial})`}
          onClick={() => setOpen((current) => !current)}
          className="flex h-full cursor-pointer items-center gap-1.5 border-r border-[#e4e9ef] px-3 font-manrope text-[14px] font-medium leading-none text-[#1a1a1a]"
        >
          <CountryFlag id={country.id} />
          <span>({country.dial})</span>
          <svg viewBox="0 0 12 12" aria-hidden="true" className="h-3 w-3 text-[#8b939e]">
            <path
              d="M2.5 4.5 6 8l3.5-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
        </button>
        {open ? (
          <ul
            role="listbox"
            aria-label={label}
            className="absolute left-0 top-[calc(100%+6px)] z-30 max-h-56 w-36 overflow-auto rounded-[10px] border border-[#e4e9ef] bg-white py-1 shadow-[0_12px_30px_rgba(11,31,77,0.12)]"
          >
            {countryCodes.map((item) => (
              <li key={item.id} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={item.id === country.id}
                  onClick={() => {
                    onCountryChange(item.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left font-manrope text-[13px] font-medium text-[#1a1a1a]",
                    item.id === country.id ? "bg-[#f4f6fa]" : "hover:bg-[#f7f9fc]",
                  )}
                >
                  <CountryFlag id={item.id} />
                  <span>({item.dial})</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <input
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete={autoComplete}
        value={digits}
        onChange={(event) =>
          onDigitsChange(event.target.value.replace(/\D/g, "").slice(0, country.digits))
        }
        onBlur={onBlur}
        placeholder={phonePlaceholder(country.digits)}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        className="h-full min-w-0 flex-1 border-0 bg-transparent px-3.5 font-manrope text-[14px] font-medium text-navy outline-none placeholder:text-[#b0b7c0]"
      />
    </div>
  );
}
