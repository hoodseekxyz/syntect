import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shell } from "@/components/shell";
import { DiveLive, HuntLive, InkLive } from "@/components/live";
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
  { to: "/bench", key: "navBench", line: "inkMove", live: InkLive, accent: "#ff4d8d" },
  { to: "/dive", key: "navDive", line: "diveMove", live: DiveLive, accent: "#8ec8f5" },
  { to: "/hunt", key: "navHunt", line: "huntMove", live: HuntLive, accent: "#7dba6a" },
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

      <section className="mx-auto grid max-w-6xl gap-4 px-4 py-8 lg:grid-cols-3">
        {DOORS.map((door) => {
          const Live = door.live;
          const body = (
            <>
              <div className="mb-3 flex items-end justify-between px-1">
                <h2 className="font-display text-4xl" style={{ color: door.accent }}>
                  {t(door.key)}
                </h2>
                <span className="text-xs text-phosphor">{wallet.address ? t("play") : t("locked")}</span>
              </div>
              <Live />
              <p className="px-1 pt-3 text-sm text-bone">{t(door.line)}</p>
            </>
          );
          return wallet.address ? (
            <Link key={door.to} to={door.to} className="block rounded-3xl border border-line bg-ink-2 p-3">
              {body}
            </Link>
          ) : (
            <article key={door.to} className="rounded-3xl border border-line bg-ink-2 p-3">
              {body}
            </article>
          );
        })}
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14">
        <article className="rounded-2xl border border-line bg-ink-2 p-5">
          <p className="text-xs text-phosphor">{t("gift")}</p>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-bone">{giftLine}</p>
          {view && (
            <div className="mt-4 grid max-w-xl grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-2xl bg-keyword p-3 text-ink">
                <p className="text-[10px] uppercase">{t("pot")}</p>
                <p className="font-display text-2xl leading-none">{formatEth(view.pot)}</p>
              </div>
              <div className="rounded-2xl bg-phosphor p-3 text-ink">
                <p className="text-[10px] uppercase">{t("gift")}</p>
                <p className="font-display text-2xl leading-none">{view.giftWei > 0n ? formatEth(view.giftWei) : "—"}</p>
              </div>
              <div className={`rounded-2xl p-3 text-ink ${holds ? "bg-comment" : "bg-num"}`}>
                <p className="text-[10px] uppercase">hold</p>
                <p className="font-display text-2xl leading-none">{holds ? "yes" : "no"}</p>
              </div>
              <div className="rounded-2xl bg-fn p-3 text-ink">
                <p className="text-[10px] uppercase">15m</p>
                <p className="font-display text-2xl leading-none">{cooled ? "open" : "wait"}</p>
              </div>
            </div>
          )}
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
