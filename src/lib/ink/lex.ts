const KEYWORDS = new Set([
  "fn",
  "let",
  "mut",
  "pub",
  "struct",
  "impl",
  "enum",
  "trait",
  "use",
  "mod",
  "return",
  "if",
  "else",
  "for",
  "while",
  "loop",
  "match",
  "async",
  "await",
  "const",
  "function",
  "class",
  "def",
  "import",
  "from",
  "var",
  "type",
  "where",
  "self",
  "Self",
  "true",
  "false",
  "null",
  "None",
  "Some",
  "in",
  "of",
  "new",
  "yield",
  "break",
  "continue",
  "as",
  "is",
  "not",
  "and",
  "or",
  "elif",
  "pass",
  "with",
]);

export type Kind = "keyword" | "string" | "comment" | "number" | "fn" | "plain";

export type Tok = { text: string; kind: Kind };

export const SAMPLES: { id: string; lang: string; code: string }[] = [
  {
    id: "rust",
    lang: "Rust",
    code: `fn detect(src: &str) -> Theme {
    let name = "base16";
    // the editor already had a theme
    if name == "base16" {
        return Theme { ink: 100 };
    }
    Theme { ink: 0 }
}`,
  },
  {
    id: "js",
    lang: "JavaScript",
    code: `function paint(line) {
  const color = "keyword";
  // syntect reads the grammar
  return line.length > 0 ? color : "bare";
}`,
  },
  {
    id: "py",
    lang: "Python",
    code: `def detect(src):
    name = "sublime"
    # comments hide in the margin
    return name if src else None`,
  },
];

function isIdent(ch: string): boolean {
  return /[A-Za-z0-9_]/.test(ch);
}

export function lex(src: string): Tok[] {
  const out: Tok[] = [];
  const n = Math.min(src.length, 4000);
  let i = 0;
  let lineStart = true;
  while (i < n) {
    const ch = src[i]!;
    if (ch === "\n") {
      out.push({ text: ch, kind: "plain" });
      i += 1;
      lineStart = true;
      continue;
    }
    if (ch === " " || ch === "\t") {
      let j = i + 1;
      while (j < n && (src[j] === " " || src[j] === "\t")) j += 1;
      out.push({ text: src.slice(i, j), kind: "plain" });
      i = j;
      continue;
    }
    if (src.startsWith("//", i) || (ch === "#" && lineStart)) {
      let j = i;
      while (j < n && src[j] !== "\n") j += 1;
      out.push({ text: src.slice(i, j), kind: "comment" });
      i = j;
      lineStart = false;
      continue;
    }
    if (src.startsWith("/*", i)) {
      const end = src.indexOf("*/", i + 2);
      const j = end < 0 ? n : Math.min(n, end + 2);
      out.push({ text: src.slice(i, j), kind: "comment" });
      i = j;
      lineStart = false;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      let j = i + 1;
      while (j < n && src[j] !== ch && src[j] !== "\n") {
        if (src[j] === "\\") j += 1;
        j += 1;
      }
      if (j < n && src[j] === ch) j += 1;
      out.push({ text: src.slice(i, j), kind: "string" });
      i = j;
      lineStart = false;
      continue;
    }
    if (/[0-9]/.test(ch)) {
      let j = i + 1;
      while (j < n && /[0-9_.]/.test(src[j]!)) j += 1;
      out.push({ text: src.slice(i, j), kind: "number" });
      i = j;
      lineStart = false;
      continue;
    }
    if (/[A-Za-z_]/.test(ch)) {
      let j = i + 1;
      while (j < n && isIdent(src[j]!)) j += 1;
      const word = src.slice(i, j);
      let k = j;
      while (k < n && (src[k] === " " || src[k] === "\t")) k += 1;
      let kind: Kind = "plain";
      if (KEYWORDS.has(word)) kind = "keyword";
      else if (src[k] === "(") kind = "fn";
      out.push({ text: word, kind });
      i = j;
      lineStart = false;
      continue;
    }
    out.push({ text: ch, kind: "plain" });
    i += 1;
    lineStart = false;
  }
  return out;
}

export function countKinds(tokens: Tok[]): { kind: Kind; n: number }[] {
  const order: Kind[] = ["keyword", "string", "comment", "fn", "number", "plain"];
  const map = new Map<Kind, number>();
  for (const kind of order) map.set(kind, 0);
  for (const tok of tokens) {
    if (tok.text.trim() === "") continue;
    map.set(tok.kind, (map.get(tok.kind) ?? 0) + 1);
  }
  return order.map((kind) => ({ kind, n: map.get(kind) ?? 0 }));
}

export function kindClass(kind: Kind): string {
  if (kind === "keyword") return "text-keyword";
  if (kind === "string") return "text-string";
  if (kind === "comment") return "text-comment";
  if (kind === "fn") return "text-fn";
  if (kind === "number") return "text-num";
  return "text-paper";
}
