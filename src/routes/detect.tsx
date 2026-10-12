import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, Cell, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { Shell } from "@/components/shell";
import { Screen } from "@/components/live";
import { useI18n } from "@/lib/i18n";
import { countKinds, kindClass, lex, SAMPLES, type Kind } from "@/lib/ink/lex";

export const Route = createFileRoute("/detect")({ component: DetectPage });

const CHIP: Record<Kind, string> = {
  keyword: "#ff4d8d",
  string: "#f0b429",
  comment: "#b6e2a8",
  number: "#ff8a4c",
  fn: "#8ec8f5",
  plain: "#9a8f7c",
};

const SCOPE: Record<Kind, string> = {
  keyword: "keyword",
  string: "string",
  comment: "comment",
  number: "number",
  fn: "function",
  plain: "plain",
};

function useVar(name: string): string {
  const [value, setValue] = useState("#d6ff3f");
  useEffect(() => {
    const next = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    if (next) setValue(next);
  }, [name]);
  return value;
}

function DetectPage() {
  const { t } = useI18n();
  const [code, setCode] = useState(SAMPLES[0]!.code);
  const [ready, setReady] = useState(false);
  const muted = useVar("--color-muted");
  const tokens = useMemo(() => lex(code), [code]);
  const counts = useMemo(() => countKinds(tokens), [tokens]);
  const bars = counts.filter((row) => row.kind !== "plain");

  useEffect(() => setReady(true), []);

  return (
    <Shell>
      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1.3fr_0.7fr]">
        <div>
          <h1 className="text-5xl text-paper">{t("detectTitle")}</h1>
          <p className="mt-3 max-w-xl text-sm text-bone">{t("detectMove")}</p>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {SAMPLES.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => setCode(sample.code)}
                className="min-h-16 rounded-2xl border border-line bg-ink-2 px-3 text-left text-sm text-paper"
              >
                {sample.lang}
              </button>
            ))}
          </div>
          <label className="mt-4 block">
            <span className="sr-only">{t("detectTitle")}</span>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value.slice(0, 4000))}
              spellCheck={false}
              className="min-h-28 w-full rounded-2xl border border-line bg-ink-2 p-4 text-sm text-paper"
            />
          </label>
          <div className="mt-4">
            <Screen label="detect">
              <div className="mb-3 flex flex-wrap gap-2">
                {bars.map((row) => (
                  <span
                    key={row.kind}
                    className="rounded-full px-2 py-1 text-[10px]"
                    style={{ background: CHIP[row.kind], color: "#14120e" }}
                  >
                    {row.kind} {row.n}
                  </span>
                ))}
              </div>
              <pre className="relative max-w-full overflow-x-auto text-sm leading-relaxed whitespace-pre-wrap break-all">
                <span className="beam pointer-events-none absolute top-0 left-0 h-full w-16 bg-gradient-to-r from-transparent via-[#d6ff3f]/40 to-transparent" />
                {tokens.map((tok, i) => (
                  <span key={`${i}-${tok.text}`} className={kindClass(tok.kind)}>
                    {tok.text}
                  </span>
                ))}
              </pre>
            </Screen>
          </div>
        </div>
        <aside className="space-y-4">
          <div className="rounded-2xl border border-line bg-ink-2 p-4">
            <h2 className="text-2xl text-paper">{t("distribution")}</h2>
            <div className="mt-4 h-56">
              {ready && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bars} margin={{ top: 8, right: 0, left: -24, bottom: 0 }}>
                    <XAxis dataKey="kind" tick={{ fill: muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fill: muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Bar dataKey="n" radius={6}>
                      {bars.map((row) => (
                        <Cell key={row.kind} fill={CHIP[row.kind]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
          <ul className="grid grid-cols-2 gap-2">
            {counts.map((row) => (
              <li key={row.kind} className="rounded-2xl border border-line bg-ink-2 p-3">
                <span className="block h-2 w-8 rounded-full" style={{ background: CHIP[row.kind] }} />
                <span className={`mt-3 block text-sm ${kindClass(row.kind)}`}>{SCOPE[row.kind]}</span>
                <span className="font-display text-3xl text-paper tabular-nums">{row.n}</span>
              </li>
            ))}
          </ul>
        </aside>
      </section>
    </Shell>
  );
}
