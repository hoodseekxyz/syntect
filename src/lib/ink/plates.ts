import type { Brush } from "./palette";
import { hashStr } from "./rng";

export type Glyph = { text: string; brush: Brush | null };
export type Plate = { id: string; lines: Glyph[][] };

const g = (text: string, brush: Brush | null = null): Glyph => ({ text, brush });

export const PLATES: Plate[] = [
  {
    id: "theme",
    lines: [
      [g("fn", "keyword"), g(" "), g("load_theme", "bare"), g("("), g("path", "bare"), g(")")],
      [g("let", "keyword"), g(" "), g("name", "bare"), g(" = "), g('"base16"', "string"), g(";")],
      [g("// the editor already had this", "comment")],
      [g("if", "keyword"), g(" "), g("clean", "bare"), g(" == "), g("100", "bare"), g(" { "), g("return", "keyword"), g("; }")],
    ],
  },
  {
    id: "detect",
    lines: [
      [g("pub", "keyword"), g(" "), g("struct", "keyword"), g(" "), g("Scope", "bare"), g(" {")],
      [g("    "), g("name", "bare"), g(": "), g("String", "bare"), g(",")],
      [g("    "), g("// syntect reads, it does not invent", "comment")],
      [g("    "), g("ink", "bare"), g(": "), g('"phosphor"', "string"), g(",")],
    ],
  },
  {
    id: "match",
    lines: [
      [g("match", "keyword"), g(" "), g("token", "bare"), g(" {")],
      [g("    "), g('"match"', "string"), g(" => "), g("string", "bare"), g(",")],
      [g("    "), g("Theme", "bare"), g(" => "), g("bare", "bare"), g(",")],
      [g("    "), g("// match is a keyword until it is quoted", "comment")],
    ],
  },
  {
    id: "bat",
    lines: [
      [g("use", "keyword"), g(" "), g("syntect", "bare"), g("::"), g("highlighting", "bare"), g(";")],
      [g("let", "keyword"), g(" "), g("bat", "bare"), g(" = "), g("true", "keyword"), g(";")],
      [g("const", "keyword"), g(" "), g("helix", "bare"), g(" = "), g('"editor"', "string"), g(";")],
      [g("# both of them already call this library", "comment")],
    ],
  },
  {
    id: "page",
    lines: [
      [g("fn", "keyword"), g(" "), g("grade", "bare"), g("("), g("page", "bare"), g(")")],
      [g("    "), g("let", "keyword"), g(" "), g("miss", "bare"), g(" = "), g("0", "bare"), g(";")],
      [g("    "), g("if", "keyword"), g(" "), g("miss", "bare"), g(" == "), g("0", "bare"), g(" { "), g("100", "bare"), g(" }")],
      [g("    "), g("/* a clean page is a hundred, not a price */", "comment")],
    ],
  },
  {
    id: "pair",
    lines: [
      [g("let", "keyword"), g(" "), g("pair", "bare"), g(" = "), g('"MSFT"', "string"), g(";")],
      [g("let", "keyword"), g(" "), g("ticker", "bare"), g(" = "), g('"SYNTECT"', "string"), g(";")],
      [g("// the pair is not the stock", "comment")],
      [g("return", "keyword"), g(" "), g("pair", "bare"), g("; ")],
    ],
  },
];

export function platesFor(seed: string): Plate[] {
  const start = hashStr(seed) % PLATES.length;
  return [0, 1, 2, 3].map((i) => PLATES[(start + i) % PLATES.length]!);
}

export function plateTargets(plate: Plate): { id: string; text: string; brush: Brush }[] {
  const list: { id: string; text: string; brush: Brush }[] = [];
  plate.lines.forEach((line, li) => {
    line.forEach((glyph, ti) => {
      if (glyph.brush) {
        list.push({ id: `${plate.id}:${li}:${ti}`, text: glyph.text, brush: glyph.brush });
      }
    });
  });
  return list;
}
