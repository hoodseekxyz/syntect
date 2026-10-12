import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Shell, notifyInk } from "@/components/shell";
import { useI18n } from "@/lib/i18n";
import { useWallet } from "@/lib/press/wallet";
import { formatLeft, useCountdown } from "@/lib/ink/clock";
import { brushBg, brushText, BRUSHES, type Brush } from "@/lib/ink/palette";
import { plateTargets, platesFor, type Plate } from "@/lib/ink/plates";
import { dayKey } from "@/lib/ink/rng";
import { blip } from "@/lib/ink/sound";
import { loadSave, recordRun } from "@/lib/ink/store";

export const Route = createFileRoute("/bench")({ component: BenchPage });

const RUN_MS = 90_000;

type Pop = { id: number; text: string; good: boolean };
type Mode = "daily" | "press";

function BenchPage() {
  const { t } = useI18n();
  const { address } = useWallet();
  const [mode, setMode] = useState<Mode>("daily");
  const [phase, setPhase] = useState<"ready" | "play" | "done">("ready");
  const [plates, setPlates] = useState<Plate[]>([]);
  const [page, setPage] = useState(0);
  const [brush, setBrush] = useState<Brush>("keyword");
  const [locks, setLocks] = useState<Record<string, true>>({});
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [shake, setShake] = useState(0);
  const [stamp, setStamp] = useState(false);
  const [pops, setPops] = useState<Pop[]>([]);
  const [finalScore, setFinalScore] = useState(0);
  const [dailyBest, setDailyBest] = useState(0);
  const [endsAt, setEndsAt] = useState(0);

  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const missRef = useRef(0);
  const ended = useRef(false);
  const endsRef = useRef(0);
  const modeRef = useRef<Mode>("daily");

  useEffect(() => {
    const save = loadSave();
    setDailyBest(save.daily[dayKey()] ?? 0);
  }, [phase]);

  useEffect(() => {
    if (phase !== "play") return;
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, Brush> = { "1": "keyword", "2": "string", "3": "comment", "4": "bare" };
      const next = map[e.key];
      if (next) setBrush(next);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  function pop(text: string, good: boolean) {
    const id = Date.now() + Math.random();
    setPops((list) => [...list.slice(-5), { id, text, good }]);
    window.setTimeout(() => setPops((list) => list.filter((p) => p.id !== id)), 760);
  }

  function finish(reason: "time" | "clear") {
    if (ended.current) return;
    ended.current = true;
    let total = scoreRef.current;
    if (reason === "clear") {
      total += Math.max(0, Math.round((endsRef.current - performance.now()) / 1000) * 2);
    }
    total = Math.max(0, total);
    setScore(total);
    setFinalScore(total);
    setPhase("done");
    recordRun("bench", total, modeRef.current === "daily");
    notifyInk();
    if (reason === "clear") blip("clean");
  }

  const left = useCountdown(phase === "play", endsAt, () => finish("time"));

  function begin(nextMode: Mode) {
    const who = address ? `:${address.toLowerCase()}` : "";
    const seed = nextMode === "daily" ? `bench:${dayKey()}${who}` : `bench:${Date.now()}`;
    const nextPlates = platesFor(seed);
    modeRef.current = nextMode;
    ended.current = false;
    scoreRef.current = 0;
    comboRef.current = 0;
    missRef.current = 0;
    const end = performance.now() + RUN_MS;
    endsRef.current = end;
    setMode(nextMode);
    setPlates(nextPlates);
    setPage(0);
    setLocks({});
    setScore(0);
    setCombo(0);
    setBrush("keyword");
    setStamp(false);
    setEndsAt(end);
    setPhase("play");
  }

  function paint(id: string, truth: Brush) {
    if (phase !== "play" || locks[id] || ended.current) return;
    if (brush === truth) {
      const nextLocks = { ...locks, [id]: true as const };
      comboRef.current += 1;
      const bonus = comboRef.current % 4 === 0 ? 12 : 0;
      scoreRef.current += 20 + bonus;
      setCombo(comboRef.current);
      setScore(scoreRef.current);
      setLocks(nextLocks);
      pop(`+${20 + bonus}`, true);
      blip("ok");
      const plate = plates[page];
      if (!plate) return;
      const all = plateTargets(plate).every((token) => nextLocks[token.id]);
      if (!all) return;
      const clean = missRef.current === 0;
      if (clean) {
        scoreRef.current += 100;
        setScore(scoreRef.current);
        setStamp(true);
        pop("+100", true);
        blip("clean");
      }
      if (page >= plates.length - 1) {
        window.setTimeout(() => finish("clear"), 640);
        return;
      }
      window.setTimeout(() => {
        if (ended.current) return;
        missRef.current = 0;
        setStamp(false);
        setPage((p) => p + 1);
        setLocks({});
      }, 640);
      return;
    }
    comboRef.current = 0;
    missRef.current += 1;
    scoreRef.current -= 8;
    setCombo(0);
    setScore(scoreRef.current);
    setShake((n) => n + 1);
    pop("−8", false);
    blip("bad");
  }

  const plate = plates[page];

  return (
    <Shell>
      <section className="relative overflow-hidden">
        <img src="/art/desk.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/80 to-ink" />
        <div className="relative mx-auto max-w-3xl px-4 py-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs text-phosphor">{t("dailyBest")} {dailyBest}</p>
              <h1 className="text-5xl text-paper">{t("navBench")}</h1>
            </div>
            {phase === "play" && (
              <dl className="flex gap-4 text-right">
                <div>
                  <dt className="text-xs text-muted">{t("time")}</dt>
                  <dd className="text-2xl text-phosphor tabular-nums">{formatLeft(left)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">{t("score")}</dt>
                  <dd className="text-2xl text-paper tabular-nums">{score}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">{t("pages")}</dt>
                  <dd className="text-2xl text-paper tabular-nums">
                    {page + 1}/{plates.length}
                  </dd>
                </div>
              </dl>
            )}
          </div>

          {phase === "ready" && (
            <div className="mt-8 rounded-2xl border border-line bg-ink/85 p-5">
              <p className="max-w-lg text-sm leading-relaxed text-bone">{t("howBench")}</p>
              <p className="mt-3 text-sm text-muted">{t("benchBlurb")}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button type="button" className="rounded-full bg-phosphor px-5 py-3 text-sm text-ink" onClick={() => begin("daily")}>
                  {address ? t("yourPlate") : t("daily")}
                </button>
                <button type="button" className="rounded-full border border-line px-5 py-3 text-sm text-paper" onClick={() => begin("press")}>
                  {t("press")}
                </button>
              </div>
            </div>
          )}

          {phase === "play" && plate && (
            <div key={shake} className={shake ? "shake mt-6" : "mt-6"}>
              <div className="relative rounded-2xl border border-line bg-ink/90 p-4 sm:p-6">
                <div className="pointer-events-none absolute top-3 right-4">
                  {pops.map((item) => (
                    <p key={item.id} className={`pop-up text-sm ${item.good ? "text-phosphor" : "text-keyword"}`}>
                      {item.text}
                    </p>
                  ))}
                </div>
                {stamp && (
                  <p className="stamp-in pointer-events-none absolute top-8 left-4 font-display text-5xl text-phosphor">
                    100
                  </p>
                )}
                <p className="mb-4 text-xs text-muted">
                  {t("combo")} {combo}
                </p>
                <div className="space-y-3 text-base leading-loose sm:text-lg">
                  {plate.lines.map((line, li) => (
                    <div key={li} className="min-h-8">
                      {line.map((glyph, ti) => {
                        const id = `${plate.id}:${li}:${ti}`;
                        if (!glyph.brush) {
                          return (
                            <span key={id} className="text-muted">
                              {glyph.text}
                            </span>
                          );
                        }
                        const locked = Boolean(locks[id]);
                        return (
                          <button
                            key={id}
                            type="button"
                            disabled={locked}
                            onClick={() => paint(id, glyph.brush as Brush)}
                            className={`mx-0.5 inline rounded-md px-1 py-1 ${locked ? brushText(glyph.brush) : "text-bone underline decoration-dotted decoration-line underline-offset-4"}`}
                          >
                            {glyph.text}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
              <div className="sticky bottom-3 mt-4 grid grid-cols-4 gap-2 rounded-2xl border border-line bg-ink/95 p-2">
                {BRUSHES.map((item, index) => (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={brush === item}
                    onClick={() => setBrush(item)}
                    className={`min-h-11 rounded-xl px-2 py-3 text-xs sm:text-sm ${brush === item ? brushBg(item) : "bg-ink-3 text-muted"}`}
                  >
                    {index + 1} {t(item)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {phase === "done" && (
            <div className="mt-8 rounded-2xl border border-line bg-ink/90 p-6">
              <p className="text-xs text-phosphor">{t("result")}</p>
              <p className="font-display text-7xl text-paper tabular-nums">{finalScore}</p>
              <p className="mt-2 text-sm text-muted">
                {mode === "daily" ? t("daily") : t("press")}
              </p>
              <button type="button" className="mt-6 rounded-full bg-phosphor px-5 py-3 text-sm text-ink" onClick={() => begin(mode)}>
                {t("again")}
              </button>
            </div>
          )}
        </div>
      </section>
    </Shell>
  );
}
