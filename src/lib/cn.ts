export function cn(...vals: (string | false | null | undefined)[]) {
  return vals.filter(Boolean).join(" ");
}
