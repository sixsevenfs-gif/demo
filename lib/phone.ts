/**
 * Phone Number Normalization & Duplicate Detection Engine
 * Specially optimized for Indian phone numbers (+91, leading 0s, spaces, landline prefixes),
 * and supports international formats.
 */

export function normalizePhoneNumber(rawPhone: string | null | undefined): string {
  if (!rawPhone) return "";

  // Remove all whitespace, dashes, parens, dots, slashes
  let cleaned = rawPhone.replace(/[\s\-\(\)\.\/]/g, "").trim();

  // If starts with +, remove +
  if (cleaned.startsWith("+")) {
    cleaned = cleaned.substring(1);
  }

  // If starts with 91 and has 12 digits (standard Indian mobile with country code 91)
  if (cleaned.startsWith("91") && cleaned.length === 12) {
    cleaned = cleaned.substring(2);
  }

  // If starts with 0 and has 11 digits (e.g. 09876543210 or 06901301315)
  if (cleaned.startsWith("0") && cleaned.length === 11) {
    cleaned = cleaned.substring(1);
  }

  // If it still has more than 10 digits and starts with 0, strip leading zeros
  while (cleaned.length > 10 && cleaned.startsWith("0")) {
    cleaned = cleaned.substring(1);
  }

  return cleaned;
}

export function formatPhoneForDisplay(rawPhone: string | null | undefined): string {
  if (!rawPhone) return "N/A";
  const normalized = normalizePhoneNumber(rawPhone);
  if (normalized.length === 10) {
    // Return formatted as: +91 98765 43210 or 069013 01315
    return `+91 ${normalized.slice(0, 5)} ${normalized.slice(5)}`;
  }
  return rawPhone;
}

export function getTelLink(rawPhone: string | null | undefined): string {
  const norm = normalizePhoneNumber(rawPhone);
  if (!norm) return "#";
  if (norm.length === 10) {
    return `tel:+91${norm}`;
  }
  return `tel:${norm}`;
}

export function getWhatsAppLink(rawPhone: string | null | undefined, message?: string): string {
  const norm = normalizePhoneNumber(rawPhone);
  if (!norm) return "#";
  const num = norm.length === 10 ? `91${norm}` : norm;
  const url = `https://wa.me/${num}`;
  if (message) {
    return `${url}?text=${encodeURIComponent(message)}`;
  }
  return url;
}
