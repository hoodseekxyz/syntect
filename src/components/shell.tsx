import { Link } from "@tanstack/react-router";
import { Volume2, VolumeX } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { LAUNCH } from "@/lib/launch";
import { useI18n, type CopyKey } from "@/lib/i18n";
import { loadSave, rankOf } from "@/lib/ink/store";
import { isMuted, setMuted } from "@/lib/ink/sound";

const LINKS: { to: "/" | "/bench" | "/dive" | "/hunt" | "/detect" | "/desk"; key: CopyKey }[] = [
  { to: "/", key: "navHome" },
  { to: "/bench", key: "navBench" },
  { to: "/dive", key: "navDive" },
  { to: "/hunt", key: "navHunt" },
  { to: "/detect", key: "navDetect" },
  { to: "/desk", key: "navDesk" },
];

export function Shell({ children }: { children: ReactNode }) {
  const { t, locale, setLocale } = useI18n();
  const [ink, setInk] = useState(0);
  const [muted, setMute] = useState(false);

  useEffect(() => {
    const sync = () => setInk(loadSave().ink);
    sync();
    setMute(isMuted());
    window.addEventListener("syntect-ink", sync);
    return () => window.removeEventListener("syntect-ink", sync);
  }, []);

  const rank = rankOf(ink);
  const rankName = locale === "tr" ? rank.current.tr : rank.current.en;

  return (
    <div className="min-h-dvh bg-ink text-paper">
      <header className="sticky top-0 z-40 border-b border-line bg-ink/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link to="/" className="font-display text-2xl leading-none tracking-tight text-paper">
            Syntect
          </Link>
          <nav className="nav-scroll flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
            {LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                activeOptions={{ exact: true }}
                className="flex min-h-11 shrink-0 items-center rounded-full px-3 text-xs text-muted hover:text-paper"
                activeProps={{ className: "flex min-h-11 shrink-0 items-center rounded-full bg-ink-3 px-3 text-xs text-phosphor" }}
              >
                {t(link.key)}
              </Link>
            ))}
          </nav>
          <div className="hidden items-center gap-2 sm:flex">
            <span className="text-xs text-muted">{rankName}</span>
            <span className="tabular-nums text-xs text-phosphor">{ink}</span>
          </div>
          <button
            type="button"
            className="min-h-11 rounded-full border border-line px-3 text-xs text-muted"
            onClick={() => setLocale(locale === "en" ? "tr" : "en")}
          >
            {locale === "en" ? "TR" : "EN"}
          </button>
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
            <a className="text-paper hover:text-phosphor" href="https://x.com/syntectXYZ" target="_blank" rel="noreferrer">
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
