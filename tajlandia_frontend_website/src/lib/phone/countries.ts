export type CountryCode = {
  id: string;
  name: string;
  dial: string;
  digits: number;
};

export const countryCodes: readonly CountryCode[] = [
  { id: "PL", name: "Poland", dial: "+48", digits: 9 },
  { id: "AU", name: "Australia", dial: "+61", digits: 9 },
  { id: "FR", name: "France", dial: "+33", digits: 9 },
  { id: "DE", name: "Germany", dial: "+49", digits: 11 },
  { id: "IN", name: "India", dial: "+91", digits: 10 },
  { id: "SG", name: "Singapore", dial: "+65", digits: 8 },
  { id: "TH", name: "Thailand", dial: "+66", digits: 9 },
  { id: "AE", name: "United Arab Emirates", dial: "+971", digits: 9 },
  { id: "GB", name: "United Kingdom", dial: "+44", digits: 10 },
  { id: "US", name: "United States", dial: "+1", digits: 10 },
];

export const defaultCountry = countryCodes[0]!;

export function findCountry(id: string) {
  return countryCodes.find((item) => item.id === id) ?? defaultCountry;
}

export function phonePlaceholder(digits: number) {
  return "0".repeat(digits).replace(/(.{3})/g, "$1 ").trim();
}

export function formatNationalNumber(digits: string) {
  return digits.replace(/(.{3})/g, "$1 ").trim();
}

export function splitStoredPhone(stored: string | undefined) {
  const raw = (stored ?? "").trim();
  if (!raw) return { countryCode: defaultCountry.id, phone: "" };

  const compact = raw.replace(/\s/g, "");
  const match = [...countryCodes]
    .sort((left, right) => right.dial.length - left.dial.length)
    .find((country) => compact.startsWith(country.dial));

  if (!match) {
    return { countryCode: defaultCountry.id, phone: raw.replace(/\D/g, "").slice(0, defaultCountry.digits) };
  }

  return {
    countryCode: match.id,
    phone: compact.slice(match.dial.length).replace(/\D/g, "").slice(0, match.digits),
  };
}
