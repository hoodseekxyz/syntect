import { Link } from "@tanstack/react-router";
import { Volume2, VolumeX } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { LAUNCH } from "@/lib/launch";
import { useI18n, type CopyKey } from "@/lib/i18n";
import { loadSave, rankOf } from "@/lib/ink/store";
import { isMuted, setMuted } from "@/lib/ink/sound";
import { shortAddress } from "@/lib/press/chain";
import { useWallet } from "@/lib/press/wallet";

const LINKS: { to: "/" | "/bench" | "/dive" | "/hunt" | "/detect" | "/desk" | "/room"; key: CopyKey; dot: string }[] = [
  { to: "/", key: "navHome", dot: "bg-phosphor" },
  { to: "/bench", key: "navBench", dot: "bg-keyword" },
  { to: "/dive", key: "navDive", dot: "bg-fn" },
  { to: "/hunt", key: "navHunt", dot: "bg-comment" },
  { to: "/detect", key: "navDetect", dot: "bg-string" },
  { to: "/desk", key: "navDesk", dot: "bg-num" },
  { to: "/room", key: "navRoom", dot: "bg-paper" },
];

type Sheet = "dark" | "light";

function readSheet(): Sheet {
  if (typeof document === "undefined") return "dark";
  const saved = localStorage.getItem("syntect.ink");
  if (saved === "light" || saved === "dark") return saved;
  return document.documentElement.dataset.ink === "light" ? "light" : "dark";
}

function applySheet(sheet: Sheet) {
  document.documentElement.dataset.ink = sheet;
  localStorage.setItem("syntect.ink", sheet);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", sheet === "light" ? "#f4efe4" : "#14120e");
}

export function Shell({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const wallet = useWallet();
  const [ink, setInk] = useState(0);
  const [muted, setMute] = useState(false);
  const [sheet, setSheet] = useState<Sheet>("dark");

  useEffect(() => {
    applySheet(readSheet());
    setSheet(readSheet());
  }, []);

  useEffect(() => {
    const sync = () => setInk(loadSave().ink);
    sync();
    setMute(isMuted());
    window.addEventListener("syntect-ink", sync);
    return () => window.removeEventListener("syntect-ink", sync);
  }, []);

  const rank = rankOf(ink);
  const rankName = rank.current.en;
  const nav = (className: string) => (
    <nav className={className}>
      {LINKS.map((link) => (
        <Link
          key={link.to}
          to={link.to}
          activeOptions={{ exact: true }}
          className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs text-muted hover:text-paper"
          activeProps={{ className: "flex min-h-11 shrink-0 items-center gap-1.5 rounded-full bg-ink-3 px-3 text-xs text-phosphor" }}
        >
          <i className={`size-1.5 rounded-full ${link.dot}`} />
          {t(link.key)}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="min-h-dvh bg-ink text-paper">
      <header className="sticky top-0 z-40 border-b border-line bg-ink/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to="/" className="font-display text-2xl leading-none tracking-tight text-paper">
              Syntect
            </Link>
            {nav("nav-scroll hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto lg:flex")}
            <div className="ml-auto hidden items-center gap-2 lg:ml-0 lg:flex">
              <span className="text-xs text-muted">{rankName}</span>
              <span className="tabular-nums text-xs text-phosphor">{ink}</span>
            </div>
            <div role="group" aria-label={t("theme")} className="ml-auto flex shrink-0 rounded-full border border-line p-0.5 lg:ml-0">
              {(["dark", "light"] as const).map((mode) => {
                const on = sheet === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    aria-pressed={on}
                    className={`min-h-11 rounded-full px-3 text-xs ${on ? "bg-phosphor text-ink" : "text-muted"}`}
                    onClick={() => {
                      applySheet(mode);
                      setSheet(mode);
                    }}
                  >
                    {t(mode)}
                  </button>
                );
              })}
            </div>
            <Link
              to="/room"
              className="flex min-h-11 shrink-0 items-center rounded-full border border-line px-3 text-xs text-paper"
            >
              {wallet.address ? shortAddress(wallet.address) : t("connect")}
            </Link>
            <button
              type="button"
              aria-pressed={!muted}
              aria-label={muted ? t("unmute") : t("mute")}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line text-muted"
              onClick={() => {
                const next = !muted;
                setMuted(next);
                setMute(next);
              }}
            >
              {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
            </button>
          </div>
          {nav("nav-scroll mt-1 flex items-center gap-1 overflow-x-auto lg:hidden")}
        </div>
        <p className="border-t border-line px-4 py-2 text-center text-xs text-muted">{t("banner")}</p>
      </header>
      <main>{children}</main>
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-xs text-muted">
          <p className="max-w-3xl leading-relaxed">{t("disclaimer")}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <a className="text-paper hover:text-phosphor" href="https://github.com/trishume/syntect" target="_blank" rel="noreferrer">
              trishume/syntect
            </a>
            <a className="text-paper hover:text-phosphor" href="https://docs.rs/syntect" target="_blank" rel="noreferrer">
              docs.rs
            </a>
            <a className="text-paper hover:text-phosphor" href="https://crates.io/crates/syntect" target="_blank" rel="noreferrer">
              crates.io
            </a>
            <a className="text-paper hover:text-phosphor" href="https://ponsfamily.com/launchpad" target="_blank" rel="noreferrer">
              Pons
            </a>
            <a className="text-paper hover:text-phosphor" href={LAUNCH.telegram} target="_blank" rel="noreferrer">
              {LAUNCH.handle}
            </a>
            <span>{LAUNCH.site}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function notifyInk() {
  window.dispatchEvent(new Event("syntect-ink"));
}
