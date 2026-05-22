/**
 * Phone-as-identity helpers.
 *
 * We don't use Supabase native phone+OTP (it requires an SMS provider).
 * Instead we synthesize a deterministic email from the phone number so we can
 * use the standard email/password flow with auto-confirm enabled.
 */

const PHONE_EMAIL_DOMAIN = "phone.zeetop.local";

/**
 * Normalize any user-typed phone string to digits-only E.164-ish form
 * (no leading + sign in storage, but we accept it as input).
 *
 * Defaults Tanzanian numbers ("0XXXXXXXXX") to +255.
 * Accepts already-international numbers ("+2547..." or "2547...").
 * Returns null if the input is too short / invalid.
 */
export function normalizePhone(raw: string): string | null {
  if (!raw) return null;
  let digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  // Strip leading zeros only when followed by something else
  if (digits.startsWith("00")) digits = digits.slice(2);
  // Tanzanian local form: 07XXXXXXXX -> 2557XXXXXXXX
  if (digits.startsWith("0") && digits.length === 10) {
    digits = "255" + digits.slice(1);
  }
  if (digits.length < 9 || digits.length > 15) return null;
  return digits;
}

export function phoneToEmail(phone: string): string {
  const norm = normalizePhone(phone);
  if (!norm) throw new Error("Invalid phone number");
  return `${norm}@${PHONE_EMAIL_DOMAIN}`;
}

export function isPhoneEmail(email?: string | null): boolean {
  return !!email && email.endsWith(`@${PHONE_EMAIL_DOMAIN}`);
}

export function emailToPhone(email?: string | null): string | null {
  if (!email || !isPhoneEmail(email)) return null;
  return "+" + email.split("@")[0];
}

export function formatPhoneForDisplay(phone: string): string {
  const n = normalizePhone(phone);
  return n ? "+" + n : phone;
}
