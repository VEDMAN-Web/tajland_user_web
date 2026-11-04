/** A count as two digits ("05", "12"); zero stays "0" rather than "00". */
export function formatCount(value: number): string {
  return value === 0 ? "0" : String(value).padStart(2, "0");
}
