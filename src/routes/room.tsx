import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shell } from "@/components/shell";
import { useI18n } from "@/lib/i18n";
import {
  activePress,
  formatEth,
  readPress,
  shortAddress,
  txData,
  ZERO_ADDRESS,
  type PressView,
} from "@/lib/press/chain";
import { useWallet } from "@/lib/press/wallet";

export const Route = createFileRoute("/room")({ component: RoomPage });

const DOORS = [
  { to: "/bench", key: "navBench", line: "benchBlurb" },
  { to: "/dive", key: "navDive", line: "diveBlurb" },
  { to: "/hunt", key: "navHunt", line: "huntBlurb" },
] as const;

function RoomPage() {
  const { t } = useI18n();
  const wallet = useWallet();
  const [view, setView] = useState<PressView | null>(null);
  const [press, setPress] = useState<`0x${string}` | "">("");
  const [err, setErr] = useState("");

  useEffect(() => {
    setPress(activePress());
  }, []);

  useEffect(() => {
    if (!press) {
      setView(null);
      return;
    }
    let live = true;
    readPress(press, wallet.address)
      .then((next) => {
        if (live) setView(next);
      })
      .catch(() => {
        if (live) setView(null);
      });
    return () => {
      live = false;
    };
  }, [press, wallet.address]);

  const now = BigInt(Math.floor(Date.now() / 1000));
  const live = Boolean(view && view.syntect !== ZERO_ADDRESS);
  const holds = Boolean(view && view.hold >= view.minHold);
  const cooled = Boolean(view && now >= view.lastClaim + view.window);
  const canClaim = Boolean(
    wallet.address && press && live && view && view.giftWei > 0n && view.pot >= view.giftWei && holds && cooled,
  );

  let giftLine = t("giftClosed");
  if (!press) giftLine = t("noPress");
  else if (view && !live) giftLine = t("giftClosed");
  else if (view && view.giftWei === 0n) giftLine = t("giftUnset");
  else if (view && !holds) giftLine = t("giftShort");
  else if (view && !cooled) giftLine = t("giftEarly");
  else if (view && view.pot < view.giftWei) giftLine = t("giftDry");
  else if (canClaim) giftLine = t("giftReady");

  return (
    <Shell>
      <section className="relative overflow-hidden border-b border-line">
        <img src="/art/desk.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-ink/80" />
        <div className="relative mx-auto max-w-6xl px-4 py-14">
          <p className="text-xs text-phosphor">{wallet.address ? shortAddress(wallet.address) : t("locked")}</p>
          <h1 className="mt-2 text-5xl text-paper sm:text-6xl">{t("roomTitle")}</h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-bone">{t("roomLine")}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {wallet.address ? (
              <button type="button" className="min-h-11 rounded-full border border-line px-5 text-sm text-paper" onClick={wallet.disconnect}>
                {t("disconnect")}
              </button>
            ) : (
              <button type="button" className="min-h-11 rounded-full bg-phosphor px-5 text-sm text-ink" onClick={() => void wallet.connect()}>
                {t("connect")}
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-8 md:grid-cols-3">
        {DOORS.map((door) =>
          wallet.address ? (
            <Link key={door.to} to={door.to} className="rounded-2xl border border-line bg-ink-2 p-5">
              <p className="text-xs text-phosphor">{t("play")}</p>
              <h2 className="mt-2 font-display text-4xl text-paper">{t(door.key)}</h2>
              <p className="mt-3 text-sm text-bone">{t(door.line)}</p>
            </Link>
          ) : (
            <article key={door.to} className="rounded-2xl border border-dashed border-line bg-ink-2 p-5">
              <p className="text-xs text-muted">{t("locked")}</p>
              <h2 className="mt-2 font-display text-4xl text-muted">{t(door.key)}</h2>
              <p className="mt-3 text-sm text-muted">{t("roomClosed")}</p>
            </article>
          ),
        )}
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14">
        <article className="rounded-2xl border border-line bg-ink-2 p-5">
          <p className="text-xs text-phosphor">{t("gift")}</p>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-bone">{giftLine}</p>
          {view && (
            <p className="mt-3 text-xs text-muted">
              {t("pot")} {formatEth(view.pot)} ETH
              {view.giftWei > 0n ? ` · ${formatEth(view.giftWei)} ETH` : ""}
              {wallet.address ? (holds ? " · holding" : " · not holding") : ""}
            </p>
          )}
          {canClaim && press && (
            <button
              type="button"
              disabled={wallet.busy}
              className="mt-4 min-h-11 rounded-full bg-phosphor px-5 text-sm text-ink disabled:opacity-50"
              onClick={() => {
                setErr("");
                void wallet.send(press, txData("claimGift")).catch((error: unknown) => {
                  setErr(error instanceof Error ? error.message.slice(0, 180) : "Rejected.");
                });
              }}
            >
              {t("gift")}
            </button>
          )}
          {(err || wallet.error) && <p className="mt-3 text-xs text-keyword">{err || wallet.error}</p>}
        </article>
      </section>
    </Shell>
  );
}
