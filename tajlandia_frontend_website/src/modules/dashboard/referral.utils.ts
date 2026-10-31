import type { ReferralLooseItem } from "./schemas/referral.schema";

// The referral list endpoints have no documented item shape, so these read the likely
// fields and fall back; revisit once the backend returns real rows.

function text(item: ReferralLooseItem, keys: string[]): string | null {
  for (const key of keys) {
    const value = item[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function number(item: ReferralLooseItem, keys: string[]): number | null {
  for (const key of keys) {
    const value = item[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return null;
}

/** Nested `{ firstName, lastName }` person under one of these keys, as "First Last". */
function personName(item: ReferralLooseItem): string | null {
  for (const key of ["referee", "referredUser", "user", "invitee"]) {
    const value = item[key];
    if (value && typeof value === "object") {
      const person = value as ReferralLooseItem;
      const name = [text(person, ["firstName"]), text(person, ["lastName"])].filter(Boolean).join(" ");
      if (name) return name;
      const single = text(person, ["name", "fullName"]);
      if (single) return single;
    }
  }
  return null;
}

export type ReferralRow = {
  id: string;
  name: string | null;
  /** "COMPLETED", "PENDING", ... upper-case, or null. */
  status: string | null;
  points: number | null;
  date: string | null;
};

export function toReferralRow(item: ReferralLooseItem, index: number): ReferralRow {
  const first = text(item, ["firstName", "refereeFirstName"]);
  const last = text(item, ["lastName", "refereeLastName"]);
  const joined = [first, last].filter(Boolean).join(" ");
  return {
    id: text(item, ["_id", "id"]) ?? `referral-${index}`,
    name:
      personName(item) ??
      (joined || text(item, ["name", "fullName", "refereeName", "referredUserName", "referredName"])),
    status: text(item, ["status", "state"])?.toUpperCase() ?? null,
    points: number(item, ["pointsAwarded", "points", "rewardPoints", "reward"]),
    date: text(item, ["completedAt", "createdAt", "joinedAt", "date"]),
  };
}

export type RewardRow = {
  id: string;
  title: string | null;
  /** Positive earned, negative spent. */
  points: number | null;
  date: string | null;
};

export function toRewardRow(item: ReferralLooseItem, index: number): RewardRow {
  const points = number(item, ["points", "amount", "pointsDelta", "value"]);
  const type = text(item, ["type", "direction", "transactionType"])?.toUpperCase() ?? "";
  const signed =
    points !== null && /DEBIT|SPEND|SPENT|REDEEM|WITHDRAW/.test(type) ? -Math.abs(points) : points;
  return {
    id: text(item, ["_id", "id"]) ?? `reward-${index}`,
    title: text(item, ["description", "reason", "note", "title", "type"]),
    points: signed,
    date: text(item, ["createdAt", "date", "updatedAt"]),
  };
}

/** `2026-10-31T00:00:00.000Z` → `Oct 31, 2026`. */
export function formatReferralDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric", timeZone: "UTC" });
}

/** The link a user shares: our signup page with their code. */
export function referralShareLink(origin: string, code: string) {
  return `${origin}/signup?ref=${encodeURIComponent(code)}`;
}
