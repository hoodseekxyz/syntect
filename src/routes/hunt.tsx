import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Shell, notifyInk } from "@/components/shell";
import { useI18n } from "@/lib/i18n";
import { useWallet } from "@/lib/press/wallet";
import { formatLeft, useCountdown } from "@/lib/ink/clock";
import { dayKey, hashStr, mulberry32, shuffle } from "@/lib/ink/rng";
import { blip } from "@/lib/ink/sound";
import { recordRun } from "@/lib/ink/store";

export const Route = createFileRoute("/hunt")({ component: HuntPage });

const DECOYS = [
  "fn",
  "let",
  "mut",
  "pub",
  "match",
  "impl",
  "return",
  "await",
  '"theme"',
  '"//no"',
  "100",
  "String",
  "None",
  "true",
  "struct",
  "enum",
  "async",
  "where",
  "const",
  "import",
  "class",
  '"comment"',
];

const COMMENTS = ["// leak", "/* ink */", "# quiet", "// msft", "/*scope*/", "# aside", "// clean", "/*100*/"];

const RUN_MS = 50_000;

type Cell = { id: string; text: string; comment: boolean; state: "open" | "hit" | "miss" };

function wave(rnd: () => number, n: number): Cell[] {
  const comments = shuffle(COMMENTS, rnd).slice(0, 3);
  const decoys = shuffle(DECOYS, rnd).slice(0, 13);
  const cells: Cell[] = [
    ...comments.map((text, i) => ({ id: `c-${n}-${i}-${text}`, text, comment: true, state: "open" as const })),
    ...decoys.map((text, i) => ({ id: `d-${n}-${i}-${text}`, text, comment: false, state: "open" as const })),
  ];
  return shuffle(cells, rnd);
}

function HuntPage() {
  const { t } = useI18n();
  const { address } = useWallet();
  const rnd = useRef<() => number>(() => 0);
  const ended = useRef(false);
  const scoreRef = useRef(0);
  const waveRef = useRef(1);
  const [phase, setPhase] = useState<"ready" | "play" | "done">("ready");
  const [cells, setCells] = useState<Cell[]>([]);
  const [waveNo, setWaveNo] = useState(1);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [found, setFound] = useState(0);
  const [shake, setShake] = useState(0);
  const [endsAt, setEndsAt] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [daily, setDaily] = useState(true);

  function finish() {
    if (ended.current) return;
    ended.current = true;
    const total = Math.max(0, scoreRef.current);
    setFinalScore(total);
    setPhase("done");
    recordRun("hunt", total, daily);
    notifyInk();
  }

  const left = useCountdown(phase === "play", endsAt, finish);

  function begin(isDaily: boolean) {
    const who = address ? `:${address.toLowerCase()}` : "";
    const seed = hashStr(isDaily ? `hunt:${dayKey()}${who}` : `hunt:${Date.now()}`);
    rnd.current = mulberry32(seed);
    ended.current = false;
    scoreRef.current = 0;
    waveRef.current = 1;
    setDaily(isDaily);
    setCells(wave(rnd.current, 1));
    setWaveNo(1);
    setLives(3);
    setScore(0);
    setFound(0);
    setEndsAt(performance.now() + RUN_MS);
    setPhase("play");
  }

  function tap(cell: Cell) {
    if (phase !== "play" || cell.state !== "open" || ended.current) return;
    if (cell.comment) {
      scoreRef.current += 25;
      setScore(scoreRef.current);
      blip("ok");
      setCells((current) => {
        const next = current.map((item) => (item.id === cell.id ? { ...item, state: "hit" as const } : item));
        const remaining = next.filter((item) => item.comment && item.state === "open").length;
        if (remaining === 0 && waveRef.current < 6) {
          scoreRef.current += 20;
          setScore(scoreRef.current);
          waveRef.current += 1;
          window.setTimeout(() => {
            if (ended.current) return;
            setWaveNo(waveRef.current);
            setFound(0);
            setCells(wave(rnd.current, waveRef.current));
            blip("clean");
          }, 280);
        } else if (remaining === 0) {
          window.setTimeout(() => finish(), 280);
        }
        return next;
      });
      setFound((n) => n + 1);
      return;
    }
    blip("bad");
    setShake((n) => n + 1);
    setCells((current) => current.map((item) => (item.id === cell.id ? { ...item, state: "miss" as const } : item)));
    setLives((n) => {
      const next = n - 1;
      if (next <= 0) window.setTimeout(finish, 200);
      return next;
    });
  }

  return (
    <Shell>
      <section className="relative overflow-hidden">
        <img src="/art/beam.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" />
        <div className="absolute inset-0 bg-ink/82" />
        <div className="relative mx-auto max-w-3xl px-4 py-8">
          <h1 className="text-5xl text-paper">{t("navHunt")}</h1>
          <p className="mt-3 max-w-lg text-sm text-bone">{t("howHunt")}</p>

          {phase === "ready" && (
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" className="rounded-full bg-phosphor px-5 py-3 text-sm text-ink" onClick={() => begin(true)}>
                {address ? t("yourPlate") : t("daily")}
              </button>
              <button type="button" className="rounded-full border border-line px-5 py-3 text-sm" onClick={() => begin(false)}>
                {t("press")}
              </button>
            </div>
          )}

          {phase === "play" && (
            <div key={shake} className={shake ? "shake mt-6" : "mt-6"}>
              <div className="mb-4 flex flex-wrap gap-6">
                <Meter label={t("time")} value={formatLeft(left)} />
                <Meter label={t("score")} value={String(score)} />
                <Meter label={t("wave")} value={`${waveNo}/6`} />
                <Meter label={t("found")} value={`${Math.min(found, 3)}/3`} />
                <Meter label={t("lives")} value={String(Math.max(0, lives))} />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {cells.map((cell) => (
                  <button
                    key={cell.id}
                    type="button"
                    onClick={() => tap(cell)}
                    className={`min-h-16 rounded-xl border px-3 py-3 text-sm ${
                      cell.state === "hit"
                        ? "border-comment bg-comment text-ink"
                        : cell.state === "miss"
                          ? "border-keyword text-keyword"
                          : cell.text.startsWith('"')
                            ? "border-line bg-ink-2 text-string"
                            : /^[0-9]/.test(cell.text)
                              ? "border-line bg-ink-2 text-num"
                              : "border-line bg-ink-2 text-paper"
                    }`}
                  >
                    {cell.text}
                  </button>
                ))}
              </div>
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
