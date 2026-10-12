import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { Shell } from "@/components/shell";
import { useI18n } from "@/lib/i18n";
import { LAUNCH } from "@/lib/launch";
import { loadSave, rankOf, RANKS, type InkSave } from "@/lib/ink/store";

export const Route = createFileRoute("/desk")({ component: DeskPage });

const FLOW = ["flow1", "flow2", "flow3", "flow4", "flow5"] as const;

function DeskPage() {
  const { t, locale } = useI18n();
  const [save, setSave] = useState<InkSave | null>(null);
  const [ready, setReady] = useState(false);
  const [muted, setMuted] = useState("#9a8f7c");
  const [phosphor, setPhosphor] = useState("#d6ff3f");

  useEffect(() => {
    setSave(loadSave());
    setReady(true);
    const style = getComputedStyle(document.documentElement);
    const m = style.getPropertyValue("--color-muted").trim();
    const p = style.getPropertyValue("--color-phosphor").trim();
    if (m) setMuted(m);
    if (p) setPhosphor(p);
  }, []);

  const rank = rankOf(save?.ink ?? 0);
  const rankName = locale === "tr" ? rank.current.tr : rank.current.en;
  const nextName = rank.next ? (locale === "tr" ? rank.next.tr : rank.next.en) : "—";
  const history =
    save?.history.map((row, i) => ({
      i: i + 1,
      score: row.score,
      game: row.game,
    })) ?? [];
  const span = rank.next ? rank.next.ink - rank.current.ink : 1;
  const into = rank.next ? Math.min(100, Math.round((((save?.ink ?? 0) - rank.current.ink) / span) * 100)) : 100;

  const rows = [
    [t("pair"), LAUNCH.pair],
    [t("fee"), LAUNCH.creatorFee],
    [t("opening"), LAUNCH.openingBuy],
    [t("buyback"), LAUNCH.buyback ? t("on") : t("off")],
    [t("holders"), LAUNCH.holders ? t("on") : t("off")],
    [t("feeWallet"), t("signing")],
  ];

  return (
    <Shell>
      <section className="relative overflow-hidden border-b border-line">
        <img src="/art/plates.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-ink/80" />
        <div className="relative mx-auto max-w-6xl px-4 py-12">
          <p className="text-xs text-phosphor">{LAUNCH.ticker}</p>
          <h1 className="mt-2 text-5xl text-paper sm:text-6xl">{t("deskTitle")}</h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-bone">{t("feeLine")}</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-line bg-ink-2 p-4">
          <h2 className="text-2xl">{t("settings")}</h2>
          <table className="mt-4 w-full text-left text-sm">
            <tbody>
              {rows.map(([k, v]) => (
                <tr key={k} className="border-b border-line">
                  <th className="py-3 pr-4 font-normal text-muted">{k}</th>
                  <td className="py-3 text-paper">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-5 flex h-3 overflow-hidden rounded-full bg-ink-3">
              <div className="h-full grow bg-bone" />
              <div className="h-full w-2 bg-phosphor" />
            </div>
          <p className="mt-2 text-xs text-muted">99 · 1</p>
          <ol className="mt-5 grid gap-2 sm:grid-cols-5">
            {FLOW.map((key, i) => (
              <li key={key} className="rounded-xl border border-line bg-ink p-3 text-xs text-bone">
                <span className="text-phosphor">{i + 1}</span>
                <p className="mt-2">{t(key)}</p>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-xs leading-relaxed text-muted">{t("sitePays")}</p>
        </div>

        <div className="space-y-4">
          <article className="rounded-2xl border border-dashed border-phosphor/70 bg-ink-2 p-5">
            <p className="text-xs text-phosphor">{t("contractLabel")}</p>
            {LAUNCH.contract ? (
              <p className="mt-3 break-all text-sm text-paper">{LAUNCH.contract}</p>
            ) : (
              <>
                <p className="mt-3 font-display text-3xl text-paper">{t("contractEmpty")}</p>
                <p className="mt-2 text-xs text-muted">{t("awaiting")}</p>
              </>
            )}
          </article>

          <article className="rounded-2xl border border-line bg-ink-2 p-5">
            <p className="text-xs text-muted">{t("rank")}</p>
            <p className="font-display text-4xl text-paper">{save ? rankName : "—"}</p>
            <p className="mt-2 text-xs text-muted">
              {t("nextRank")} · {nextName}
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink-3">
              <div className="h-full bg-phosphor" style={{ width: `${into}%` }} />
            </div>
            <ul className="mt-4 grid grid-cols-3 gap-2 text-xs">
              {RANKS.slice(1).map((item) => (
                <li key={item.id} className="rounded-lg border border-line px-2 py-2 text-muted">
                  <span className="block text-paper">{locale === "tr" ? item.tr : item.en}</span>
                  {item.ink}
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-2xl border border-line bg-ink-2 p-4">
            <h2 className="text-2xl">{t("history")}</h2>
            {history.length === 0 ? (
              <p className="mt-3 text-sm text-muted">{t("emptyHistory")}</p>
            ) : (
              <div className="mt-3 h-40">
                {ready && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={history}>
                      <XAxis dataKey="i" tick={{ fill: muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Bar dataKey="score" fill={phosphor} radius={4} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            )}
          </article>
        </div>
      </section>
    </Shell>
  );
}
