import { Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

const INK = [
  { t: "fn", c: "#ff4d8d" },
  { t: " paint", c: "#8ec8f5" },
  { t: "(", c: "#9a8f7c" },
  { t: '"page"', c: "#f0b429" },
  { t: ")", c: "#9a8f7c" },
  { t: " // skip", c: "#b6e2a8" },
];

export function Screen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="crt overflow-hidden rounded-3xl border border-white/10">
      <div className="flex items-center gap-1.5 border-b border-white/10 px-3 py-2">
        <i className="size-2 rounded-full bg-[#ff4d8d]" />
        <i className="size-2 rounded-full bg-[#f0b429]" />
        <i className="size-2 rounded-full bg-[#b6e2a8]" />
        <span className="ml-2 text-[10px] tracking-[0.18em] text-[#9a8f7c] uppercase">{label}</span>
        <span className="ml-auto flex items-center gap-1 text-[10px] tracking-wide text-[#d6ff3f] uppercase">
          <i className="live-dot size-1.5 rounded-full bg-[#d6ff3f]" />
          live
        </span>
      </div>
      <div className="crt-scan relative p-4">{children}</div>
    </div>
  );
}

export function InkLive() {
  const [n, setN] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setN((v) => (v + 1) % (INK.length + 1)), 700);
    return () => clearInterval(id);
  }, []);
  const brushes = [
    { name: "keyword", c: "#ff4d8d" },
    { name: "string", c: "#f0b429" },
    { name: "comment", c: "#b6e2a8" },
    { name: "bare", c: "#f3ead7" },
  ];
  const hot = n < 2 ? 0 : n < 4 ? 1 : n < 5 ? 3 : 2;
  return (
    <Screen label="ink">
      <p className="min-h-16 text-xl leading-relaxed sm:text-2xl">
        {INK.map((word, i) => (
          <span key={word.t} style={{ color: i < n ? word.c : "#6f675c" }}>
            {word.t}
          </span>
        ))}
      </p>
      <div className="mt-4 grid grid-cols-4 gap-2">
        {brushes.map((brush, i) => (
          <div
            key={brush.name}
            className="rounded-xl px-1 py-2 text-center text-[10px] sm:text-xs"
            style={{
              background: i === hot ? brush.c : "rgba(255,255,255,0.06)",
              color: i === hot ? "#14120e" : "#f3ead7",
            }}
          >
            {brush.name}
          </div>
        ))}
      </div>
    </Screen>
  );
}

const DIVE = ["source", "meta.function", "keyword.control", "string.quoted"];

export function DiveLive() {
  const [depth, setDepth] = useState(DIVE.length);
  useEffect(() => {
    const id = setInterval(() => setDepth((d) => (d <= 1 ? DIVE.length : d - 1)), 900);
    return () => clearInterval(id);
  }, []);
  const stack = DIVE.slice(0, depth);
  return (
    <Screen label="dive">
      <div className="flex min-h-40 flex-col justify-end gap-2">
        {stack.map((name, i) => {
          const top = i === stack.length - 1;
          return (
            <div
              key={name}
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm"
              style={{
                background: top ? "#d6ff3f" : "rgba(255,255,255,0.06)",
                color: top ? "#14120e" : "#f3ead7",
                marginLeft: `${i * 10}px`,
              }}
            >
              <i className="size-2 shrink-0 rounded-full" style={{ background: top ? "#14120e" : "#8ec8f5" }} />
              {name}
            </div>
          );
        })}
      </div>
    </Screen>
  );
}

const HUNT = [
  { t: "return", c: "#ff4d8d", hit: false },
  { t: '"// no"', c: "#f0b429", hit: false },
  { t: "// yes", c: "#b6e2a8", hit: true },
  { t: "42", c: "#ff8a4c", hit: false },
  { t: "fn", c: "#ff4d8d", hit: false },
  { t: "/* here */", c: "#b6e2a8", hit: true },
  { t: "theme", c: "#f3ead7", hit: false },
  { t: '"trap"', c: "#f0b429", hit: false },
];

const MARKS = HUNT.map((cell, i) => (cell.hit ? i : -1)).filter((i) => i >= 0);

export function HuntLive() {
  const [on, setOn] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setOn((n) => (n + 1) % MARKS.length), 900);
    return () => clearInterval(id);
  }, []);
  return (
    <Screen label="hunt">
      <div className="grid grid-cols-4 gap-2">
        {HUNT.map((cell, i) => {
          const found = cell.hit && MARKS[on] === i;
          return (
            <div
              key={cell.t}
              className="rounded-xl px-2 py-3 text-center text-xs"
              style={{
                background: found ? "#b6e2a8" : "rgba(255,255,255,0.06)",
                color: found ? "#10210f" : cell.c,
                outline: found ? "2px solid #d6ff3f" : "none",
              }}
            >
              {cell.t}
            </div>
          );
        })}
      </div>
    </Screen>
  );
}

export function DetectLive() {
  return (
    <Screen label="detect">
      <p className="text-lg leading-loose">
        {INK.map((word, i) => (
          <span key={word.t} className="scan-tok" style={{ color: word.c, animationDelay: `${i * 140}ms` }}>
            {word.t}
          </span>
        ))}
      </p>
      <div className="mt-3 flex flex-wrap gap-2 text-[10px]">
        {[
          ["keyword", "#ff4d8d"],
          ["string", "#f0b429"],
          ["comment", "#b6e2a8"],
          ["number", "#ff8a4c"],
        ].map(([name, color]) => (
          <span key={name} className="rounded-full px-2 py-1" style={{ background: color, color: "#14120e" }}>
            {name}
          </span>
        ))}
      </div>
    </Screen>
  );
}

const FLOW = ["Swap", "1%", "Escrow", "Pot", "Gift"];

export function DeskLive() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStep((n) => (n + 1) % FLOW.length), 800);
    return () => clearInterval(id);
  }, []);
  return (
    <Screen label="desk">
      <div className="grid grid-cols-5 gap-1.5">
        {FLOW.map((name, i) => (
          <div
            key={name}
            className="rounded-xl px-1 py-3 text-center text-[11px]"
            style={{
              background: i === step ? "#d6ff3f" : "rgba(255,255,255,0.06)",
              color: i === step ? "#14120e" : "#f3ead7",
            }}
          >
            {name}
          </div>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2">
        <div className="rounded-xl bg-[#ff4d8d] p-3 text-[#1a0a10]">
          <p className="text-[10px] uppercase">pot</p>
          <p className="font-display text-3xl leading-none">25</p>
        </div>
        <div className="col-span-3 rounded-xl bg-[#8ec8f5] p-3 text-[#061018]">
          <p className="text-[10px] uppercase">desk</p>
          <p className="font-display text-3xl leading-none">75</p>
        </div>
      </div>
    </Screen>
  );
}

export function PressLive() {
  return (
    <Screen label="press">
      <p className="font-display text-4xl leading-none">
        <span className="text-[#d6ff3f]">SYNTECT</span>
        <span className="text-[#9a8f7c]"> × </span>
        <span className="text-[#8ec8f5]">MSFT</span>
      </p>
      <div className="mt-5 flex h-3 overflow-hidden rounded-full bg-white/10">
        <div className="h-full min-w-0 flex-1 bg-[#f3ead7]" />
        <div className="fee-sliver h-full w-2 bg-[#d6ff3f]" />
      </div>
      <p className="mt-2 text-[10px] tracking-wide text-[#d6ff3f] uppercase">the sliver is the fee</p>
    </Screen>
  );
}

export function RoomLive() {
  return (
    <Screen label="room">
      <div className="grid grid-cols-3 gap-2">
        {[
          ["Ink", "#ff4d8d", "#1a0a10"],
          ["Dive", "#8ec8f5", "#061018"],
          ["Hunt", "#b6e2a8", "#10210f"],
        ].map(([name, bg, fg]) => (
          <div key={name} className="rounded-xl px-2 py-4 text-center font-display text-2xl" style={{ background: bg, color: fg }}>
            {name}
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-xl border border-[#d6ff3f]/40 p-3">
        <p className="text-[10px] tracking-wide text-[#d6ff3f] uppercase">gift · 15 min</p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="pot-fill h-full bg-[#d6ff3f]" />
        </div>
      </div>
    </Screen>
  );
}

export function RoomTile({
  to,
  name,
  move,
  accent,
  children,
}: {
  to: "/" | "/bench" | "/dive" | "/hunt" | "/detect" | "/desk" | "/room";
  name: string;
  move: string;
  accent: string;
  children: ReactNode;
}) {
  return (
    <Link to={to} className="block rounded-3xl border border-line bg-ink-2 p-3 transition hover:-translate-y-0.5">
      <h3 className="px-1 pb-3 font-display text-4xl" style={{ color: accent }}>
        {name}
      </h3>
      {children}
      <p className="px-1 pt-3 text-sm text-bone">{move}</p>
    </Link>
  );
}
