export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function initials(first: string | null | undefined, last: string | null | undefined) {
  const a = (first ?? "").trim().charAt(0).toUpperCase();
  const b = (last ?? "").trim().charAt(0).toUpperCase();
  return (a + b) || "?";
}

export function shortId(id: string | null | undefined, len = 6) {
  if (!id) return "";
  return id.replace(/-/g, "").slice(0, len).toUpperCase();
}

export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
