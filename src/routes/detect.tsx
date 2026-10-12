import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { Shell } from "@/components/shell";
import { useI18n } from "@/lib/i18n";
import { countKinds, kindClass, lex, SAMPLES, type Kind } from "@/lib/ink/lex";

export const Route = createFileRoute("/detect")({ component: DetectPage });

const SCOPE: Record<Kind, string> = {
  keyword: "keyword.control",
  string: "string.quoted",
  comment: "comment.line",
  number: "constant.numeric",
  fn: "entity.name.function",
  plain: "source",
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
  const phosphor = useVar("--color-phosphor");
  const muted = useVar("--color-muted");
  const tokens = useMemo(() => lex(code), [code]);
  const counts = useMemo(() => countKinds(tokens), [tokens]);
  const bars = counts.filter((row) => row.kind !== "plain");

  useEffect(() => setReady(true), []);

  return (
    <Shell>
      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1.3fr_0.7fr]">
        <div>
          <p className="text-xs text-phosphor">{t("toy")}</p>
          <h1 className="mt-2 text-5xl text-paper">{t("detectTitle")}</h1>
          <p className="mt-3 max-w-xl text-sm text-bone">{t("detectHint")}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {SAMPLES.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => setCode(sample.code)}
                className="rounded-full border border-line px-4 py-2 text-xs text-paper"
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
              className="min-h-36 w-full rounded-2xl border border-line bg-ink-2 p-4 text-sm text-paper"
            />
          </label>
          <div className="relative mt-4 overflow-hidden rounded-2xl border border-line bg-ink-2">
            <img src="/art/beam.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-20" />
            <pre className="relative max-w-full overflow-x-auto p-4 text-sm leading-relaxed whitespace-pre-wrap break-all">
              {tokens.map((tok, i) => (
                <span key={`${i}-${tok.text}`} className={kindClass(tok.kind)}>
                  {tok.text}
                </span>
              ))}
            </pre>
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
                    <Bar dataKey="n" fill={phosphor} radius={4} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
          <ul className="rounded-2xl border border-line bg-ink-2 p-4 text-sm">
            {counts.map((row) => (
              <li key={row.kind} className="flex items-center justify-between gap-3 border-b border-line py-2 last:border-0">
                <span className={kindClass(row.kind)}>{SCOPE[row.kind]}</span>
                <span className="tabular-nums text-paper">{row.n}</span>
              </li>
            ))}
          </ul>
        </aside>
      </section>
    </Shell>
  );
}
