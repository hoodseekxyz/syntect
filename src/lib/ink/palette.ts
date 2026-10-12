export type Brush = "keyword" | "string" | "comment" | "bare";

export const BRUSHES: Brush[] = ["keyword", "string", "comment", "bare"];

export function brushText(brush: Brush): string {
  if (brush === "keyword") return "text-keyword";
  if (brush === "string") return "text-string";
  if (brush === "comment") return "text-comment";
  return "text-paper";
}

export function brushBg(brush: Brush): string {
  if (brush === "keyword") return "bg-keyword text-ink";
  if (brush === "string") return "bg-string text-ink";
  if (brush === "comment") return "bg-comment text-ink";
  return "bg-paper text-ink";
}
