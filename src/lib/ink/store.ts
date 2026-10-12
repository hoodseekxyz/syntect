import { dayKey } from "./rng";

export type GameId = "bench" | "dive" | "hunt";

export type InkSave = {
  version: 1;
  ink: number;
  best: Record<GameId, number>;
  streak: number;
  lastDay: string;
  history: { t: number; game: GameId; score: number }[];
  daily: Record<string, number>;
};

const KEY = "syntect.ink.v1";

export const RANKS: { ink: number; id: string; en: string; tr: string }[] = [
  { ink: 0, id: "blank", en: "Blank page", tr: "Boş sayfa" },
  { ink: 150, id: "brush", en: "Brush", tr: "Fırça" },
  { ink: 600, id: "detect", en: "Detect", tr: "Detect" },
  { ink: 1500, id: "grammar", en: "Grammar", tr: "Gramer" },
  { ink: 4000, id: "sublime", en: "Sublime", tr: "Sublime" },
  { ink: 9000, id: "syntect", en: "Syntect", tr: "Syntect" },
];

function empty(): InkSave {
  return {
    version: 1,
    ink: 0,
    best: { bench: 0, dive: 0, hunt: 0 },
    streak: 0,
    lastDay: "",
    history: [],
    daily: {},
  };
}

export function loadSave(): InkSave {
  if (typeof window === "undefined") return empty();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw) as Partial<InkSave>;
    if (parsed.version !== 1 || !parsed.best) return empty();
    return {
      ...empty(),
      ...parsed,
      best: { ...empty().best, ...parsed.best },
      history: Array.isArray(parsed.history) ? parsed.history.slice(-24) : [],
      daily: parsed.daily ?? {},
    };
  } catch {
    return empty();
  }
}

function yesterdayKey(day: string): string {
  const d = new Date(`${day}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function recordRun(game: GameId, score: number, daily: boolean): InkSave {
  const save = loadSave();
  const earned = Math.max(0, Math.round(score));
  const day = dayKey();
  save.ink += earned;
  if (earned > save.best[game]) save.best[game] = earned;
  if (daily) {
    const prev = save.daily[day] ?? 0;
    if (earned > prev) save.daily[day] = earned;
  }
  if (earned > 0) {
    if (save.lastDay === day) {
      /* streak already counted today */
    } else if (save.lastDay === yesterdayKey(day)) {
      save.streak += 1;
      save.lastDay = day;
    } else {
      save.streak = 1;
      save.lastDay = day;
    }
  }
  save.history = [...save.history, { t: Date.now(), game, score: earned }].slice(-24);
  window.localStorage.setItem(KEY, JSON.stringify(save));
  return save;
}

export function rankOf(ink: number) {
  let current = RANKS[0]!;
  for (const rank of RANKS) {
    if (ink >= rank.ink) current = rank;
  }
  const idx = RANKS.findIndex((r) => r.id === current.id);
  const next = RANKS[idx + 1];
  return { current, next };
}
