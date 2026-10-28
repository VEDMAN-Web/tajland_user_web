/**
 * Public contact details, set per environment so no placeholder text ships.
 * A row with no value is simply not rendered.
 */
export const contactDetails = {
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || undefined,
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE?.trim() || undefined,
  /** Use `|` for line breaks, e.g. "ul. Przykładowa 1|00-001 Warszawa". */
  address: process.env.NEXT_PUBLIC_CONTACT_ADDRESS?.trim() || undefined,
};

export function addressLines(address: string | undefined): string[] {
  return address ? address.split("|").map((line) => line.trim()).filter(Boolean) : [];
}
