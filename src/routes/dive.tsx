import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Shell, notifyInk } from "@/components/shell";
import { DiveLive } from "@/components/live";
import { useI18n } from "@/lib/i18n";
import { useWallet } from "@/lib/press/wallet";
import { formatLeft, useCountdown } from "@/lib/ink/clock";
import { hashStr, mulberry32 } from "@/lib/ink/rng";
import { dayKey } from "@/lib/ink/rng";
import { blip } from "@/lib/ink/sound";
import { recordRun } from "@/lib/ink/store";

export const Route = createFileRoute("/dive")({ component: DivePage });

const SCOPES = [
  "source.rust",
  "meta.function.rust",
  "meta.block.rust",
  "meta.group.rust",
  "string.quoted.double.rust",
  "string.quoted.single.rust",
  "comment.line.double-slash.rust",
  "comment.block.rust",
  "keyword.control.rust",
  "variable.other.rust",
  "punctuation.section.block.rust",
  "support.function.rust",
];

const RUN_MS = 70_000;

function tone(name: string): string {
  if (name.startsWith("keyword")) return "border-keyword text-keyword";
  if (name.startsWith("string")) return "border-string text-string";
  if (name.startsWith("comment")) return "border-comment text-comment";
  if (name.startsWith("meta")) return "border-phosphor text-phosphor";
  if (name.startsWith("punctuation")) return "border-num text-num";
  return "border-bone text-bone";
}

function DivePage() {
  const { t } = useI18n();
  const { address } = useWallet();
  const rnd = useRef<() => number>(() => 0);
  const busy = useRef(false);
  const ended = useRef(false);
  const scoreRef = useRef(0);
  const [phase, setPhase] = useState<"ready" | "play" | "done">("ready");
  const [stack, setStack] = useState<string[]>([]);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [shake, setShake] = useState(0);
  const [endsAt, setEndsAt] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [daily, setDaily] = useState(true);

  function draw(existing: string[]): string {
    let name = SCOPES[Math.floor(rnd.current() * SCOPES.length)] ?? SCOPES[0]!;
    let guard = 0;
    while (existing.includes(name) && guard < 12) {
      name = SCOPES[Math.floor(rnd.current() * SCOPES.length)] ?? name;
      guard += 1;
    }
    return name;
  }

  function finish() {
    if (ended.current) return;
    ended.current = true;
    const total = Math.max(0, scoreRef.current);
    setFinalScore(total);
    setPhase("done");
    recordRun("dive", total, daily);
    notifyInk();
  }

  const left = useCountdown(phase === "play", endsAt, finish);

  function begin(isDaily: boolean) {
    const who = address ? `:${address.toLowerCase()}` : "";
    const seed = hashStr(isDaily ? `dive:${dayKey()}${who}` : `dive:${Date.now()}`);
    rnd.current = mulberry32(seed);
    ended.current = false;
    busy.current = false;
    scoreRef.current = 0;
    const first = draw([]);
    const second = draw([first]);
    setDaily(isDaily);
    setStack([first, second]);
    setLives(3);
    setScore(0);
    setCombo(0);
    setEndsAt(performance.now() + RUN_MS);
    setPhase("play");
  }

  function close(name: string) {
    if (phase !== "play" || ended.current || busy.current) return;
    const top = stack[stack.length - 1];
    if (name !== top) {
      blip("bad");
      setShake((n) => n + 1);
      setCombo(0);
      setLives((n) => {
        const next = n - 1;
        if (next <= 0) window.setTimeout(finish, 180);
        return next;
      });
      return;
    }
    busy.current = true;
    window.setTimeout(() => {
      busy.current = false;
    }, 180);
    const gained = 15 + Math.min(combo, 8) * 3;
    scoreRef.current += gained;
    setScore(scoreRef.current);
    setCombo((c) => c + 1);
    blip("ok");
    setStack((current) => {
      let next = current.slice(0, -1);
      if (next.length < 2 || rnd.current() > 0.45) next = [...next, draw(next)];
      if (next.length < 2) next = [...next, draw(next)];
      if (next.length > 6) next = next.slice(next.length - 6);
      return next;
    });
  }

  const inner = stack[stack.length - 1];

  return (
    <Shell>
      <section className="relative overflow-hidden">
        <img src="/art/scopes.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-ink/80" />
        <div className="relative mx-auto max-w-3xl px-4 py-8">
          <h1 className="text-5xl text-paper">{t("navDive")}</h1>

          {phase === "ready" && (
            <div className="mt-6">
              <DiveLive />
              <p className="mt-4 text-sm text-bone">{t("diveMove")}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button type="button" className="rounded-full bg-fn px-5 py-3 text-sm text-ink" onClick={() => begin(true)}>
                  {address ? t("yourPlate") : t("daily")}
                </button>
                <button type="button" className="rounded-full border border-line px-5 py-3 text-sm" onClick={() => begin(false)}>
                  {t("press")}
                </button>
              </div>
            </div>
          )}

          {phase === "play" && (
            <div key={shake} className={shake ? "shake mt-6" : "mt-6"}>
              <div className="mb-4 flex gap-6">
                <Meter label={t("time")} value={formatLeft(left)} />
                <Meter label={t("score")} value={String(score)} />
                <Meter label={t("lives")} value={String(Math.max(0, lives))} />
              </div>
              <p className="text-xs text-phosphor">{t("closeTop")}</p>
              <div className="mt-3 flex flex-col gap-2">
                {[...stack].reverse().map((name, index) => {
                  const top = index === 0;
                  return (
                    <button
                      key={`${name}-${stack.length - index}`}
                      type="button"
                      onClick={() => close(name)}
                      className={`min-h-12 rounded-xl border px-4 py-3 text-left text-sm break-all ${tone(name)} ${top ? "bg-ink-3" : "bg-ink/70 opacity-80"}`}
                    >
                      <span className={`mr-3 inline-block h-2 w-2 rounded-full ${top ? "bg-phosphor" : "bg-line"}`} />
                      {name}
                    </button>
                  );
                })}
              </div>
              <p className="mt-4 text-xs text-muted">
                {t("combo")} {combo}
                {inner ? ` · ${inner}` : ""}
              </p>
            </div>
          )}

          {phase === "done" && (
            <div className="mt-8 rounded-2xl border border-line bg-ink/90 p-6">
              <p className="text-xs text-phosphor">{t("result")}</p>
              <p className="font-display text-7xl tabular-nums">{finalScore}</p>
              <button type="button" className="mt-6 rounded-full bg-phosphor px-5 py-3 text-sm text-ink" onClick={() => begin(daily)}>
                {t("again")}
              </button>
            </div>
          )}
        </div>
      </section>
    </Shell>
  );
}

function Meter({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className="text-2xl text-paper tabular-nums">{value}</p>
    </div>
  );
}
