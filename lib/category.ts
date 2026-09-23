/** Matches imported lead categories with the simpler categories used in libraries. */
export function categoryTokens(value?: string | null) {
  return (value || "")
    .toLowerCase()
    .replace(/real\s+state/g, "real estate")
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((word) => word.length > 2 && !["for", "and", "the", "with", "agency", "company", "service", "services"].includes(word));
}

export function categoryMatchScore(a?: string | null, b?: string | null) {
  const left = categoryTokens(a); const right = categoryTokens(b);
  if (!left.length || !right.length) return 0;
  const common = left.filter((word) => right.includes(word)).length;
  return common / Math.min(left.length, right.length);
}

export function categoryMatches(a?: string | null, b?: string | null) {
  return categoryMatchScore(a, b) >= 0.5;
}
