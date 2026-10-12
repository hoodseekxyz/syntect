import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shell } from "@/components/shell";
import { useI18n } from "@/lib/i18n";
import { LAUNCH } from "@/lib/launch";
import { loadSave, rankOf, type GameId } from "@/lib/ink/store";

export const Route = createFileRoute("/")({ component: Home });

const SCAN = [
  { t: "fn", c: "text-keyword" },
  { t: " detect", c: "text-fn" },
  { t: "(", c: "text-muted" },
  { t: "src", c: "text-paper" },
  { t: ": ", c: "text-muted" },
  { t: "&str", c: "text-fn" },
  { t: ")", c: "text-muted" },
  { t: " -> ", c: "text-keyword" },
  { t: "Theme", c: "text-paper" },
];

const SQUARES = [
  { scope: "source", line: "the file", tone: "text-paper", bg: "bg-ink-3" },
  { scope: "keyword.control", line: "the claim", tone: "text-keyword", bg: "bg-ink-2" },
  { scope: "string.quoted", line: "the quote", tone: "text-string", bg: "bg-ink-3" },
  { scope: "comment.line", line: "the aside", tone: "text-comment", bg: "bg-ink-2" },
  { scope: "punctuation", line: "the bone", tone: "text-bone", bg: "bg-ink-3" },
  { scope: "meta.function", line: "the nest", tone: "text-fn", bg: "bg-ink-2" },
  { scope: "detect", line: "the beam", tone: "text-phosphor", bg: "bg-ink-3" },
];

function Home() {
  const { t, locale } = useI18n();
  const [ink, setInk] = useState<number | null>(null);
  const [best, setBest] = useState<Record<GameId, number> | null>(null);

  useEffect(() => {
    const save = loadSave();
    setInk(save.ink);
    setBest(save.best);
  }, []);

  const rank = rankOf(ink ?? 0);
  const rankName = locale === "tr" ? rank.current.tr : rank.current.en;

  return (
    <Shell>
      <section className="relative overflow-hidden">
        <img src="/art/darkroom.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/75 via-ink/70 to-ink" />
        <div className="relative mx-auto flex min-h-dvh max-w-6xl flex-col justify-end px-4 py-12">
          <p className="text-xs tracking-wide text-phosphor">MIT · Rust · bat · Helix</p>
          <h1 className="mt-3 max-w-4xl text-6xl leading-none text-paper sm:text-8xl">Syntect</h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-bone sm:text-lg">{t("tagline")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/bench" className="rounded-full bg-phosphor px-5 py-3 text-sm text-ink">
              {t("paint")}
            </Link>
            <Link to="/detect" className="rounded-full border border-paper/40 px-5 py-3 text-sm text-paper">
              {t("detect")}
            </Link>
          </div>
          <div className="mt-10 max-w-3xl rounded-2xl border border-line bg-ink/80 p-4">
            <p className="text-xs text-muted">{t("scan")}</p>
            <p className="relative mt-3 overflow-hidden text-lg sm:text-2xl">
              <span className="beam pointer-events-none absolute top-0 left-0 h-full w-16 bg-gradient-to-r from-transparent via-phosphor/50 to-transparent" />
              {SCAN.map((part, i) => (
                <span key={part.t} className={`scan-tok ${part.c}`} style={{ animationDelay: `${i * 160}ms` }}>
                  {part.t}
                </span>
              ))}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-14 sm:grid-cols-3">
        <BrushCard img="/art/brush-keyword.jpg" name={t("keyword")} line={t("keywordLine")} tone="text-keyword" />
        <BrushCard img="/art/brush-string.jpg" name={t("string")} line={t("stringLine")} tone="text-string" />
        <BrushCard img="/art/brush-comment.jpg" name={t("comment")} line={t("commentLine")} tone="text-comment" />
      </section>

      <section className="relative overflow-hidden border-y border-line">
        <img src="/art/plates.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-ink/78" />
        <div className="relative mx-auto grid max-w-6xl gap-6 px-4 py-16 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs text-phosphor">{t("pairKicker")}</p>
            <h2 className="mt-2 text-5xl text-paper sm:text-6xl">
              SYNTECT
              <span className="text-muted"> × </span>
              MSFT
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-bone">{t("pairLine")}</p>
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <Stat k={t("pair")} v={LAUNCH.pair} />
            <Stat k={t("fee")} v={LAUNCH.creatorFee} />
            <Stat k={t("yourInk")} v={ink === null ? "—" : String(ink)} />
            <Stat k={t("rank")} v={ink === null ? "—" : rankName} />
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-4xl text-paper">{t("squares")}</h2>
            <p className="mt-2 max-w-md text-sm text-muted">{t("squaresLine")}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="col-span-2 overflow-hidden rounded-2xl border border-line sm:col-span-2 sm:row-span-2">
            <img src="/art/scopes.jpg" alt="" className="h-full min-h-56 w-full object-cover" />
          </div>
          {SQUARES.map((sq, i) => (
            <article key={sq.scope} className={`min-w-0 rounded-2xl border border-line p-4 ${sq.bg}`}>
              <p className="text-xs text-muted">{String(i + 1).padStart(2, "0")}</p>
              <p className={`wrap-anywhere mt-3 font-display text-xl leading-tight ${sq.tone}`}>{sq.scope}</p>
              <p className="mt-1 text-xs text-muted">{sq.line}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="text-4xl text-paper">{t("games")}</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <GameCard
            to="/bench"
            img="/art/desk.jpg"
            title={t("navBench")}
            line={t("benchBlurb")}
            best={best?.bench}
            bestLabel={t("best")}
          />
          <GameCard
            to="/dive"
            img="/art/scopes.jpg"
            title={t("navDive")}
            line={t("diveBlurb")}
            best={best?.dive}
            bestLabel={t("best")}
          />
          <GameCard
            to="/hunt"
            img="/art/beam.jpg"
            title={t("navHunt")}
            line={t("huntBlurb")}
            best={best?.hunt}
            bestLabel={t("best")}
          />
        </div>
      </section>
    </Shell>
  );
}

function BrushCard({ img, name, line, tone }: { img: string; name: string; line: string; tone: string }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-ink-2">
      <img src={img} alt="" className="aspect-[3/4] w-full object-cover" />
      <div className="p-4">
        <h2 className={`text-3xl ${tone}`}>{name}</h2>
        <p className="mt-2 text-sm text-muted">{line}</p>
      </div>
    </article>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-2xl border border-line bg-ink/80 p-4">
      <dt className="text-xs text-muted">{k}</dt>
      <dd className="mt-2 font-display text-3xl text-paper tabular-nums">{v}</dd>
    </div>
  );
}

function GameCard({
  to,
  img,
  title,
  line,
  best,
  bestLabel,
}: {
  to: "/bench" | "/dive" | "/hunt";
  img: string;
  title: string;
  line: string;
  best?: number;
  bestLabel: string;
}) {
  return (
    <Link to={to} className="group overflow-hidden rounded-2xl border border-line bg-ink-2">
      <img src={img} alt="" className="h-40 w-full object-cover transition duration-300 group-hover:scale-[1.02]" />
      <div className="p-4">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-3xl text-paper">{title}</h3>
          <span className="text-xs text-phosphor tabular-nums">
            {bestLabel} {best ?? 0}
          </span>
        </div>
        <p className="mt-2 text-sm text-muted">{line}</p>
      </div>
    </Link>
  );
}
