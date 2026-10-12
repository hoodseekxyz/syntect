import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { LAUNCH } from "@/lib/launch";
import {
  activePress,
  explorerAddress,
  formatEth,
  isAddress,
  parseEth,
  readPress,
  rememberPress,
  shortAddress,
  txData,
  ZERO_ADDRESS,
  type PressView,
} from "@/lib/press/chain";
import { useWallet } from "@/lib/press/wallet";

export function PressDesk() {
  const { t } = useI18n();
  const wallet = useWallet();
  const [press, setPress] = useState("");
  const [view, setView] = useState<PressView | null>(null);
  const [token, setToken] = useState("");
  const [pair, setPair] = useState("");
  const [gift, setGift] = useState("0.0001");
  const [pasted, setPasted] = useState("");
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    const addr = activePress();
    setPress(addr);
    if (!addr) {
      setView(null);
      return;
    }
    try {
      setView(await readPress(addr, wallet.address));
    } catch (error) {
      setView(null);
      setErr(error instanceof Error ? error.message.slice(0, 180) : "Could not read the press.");
    }
  }, [wallet.address]);

  useEffect(() => {
    void load();
  }, [load]);

  const owner = Boolean(view && wallet.address && view.owner.toLowerCase() === wallet.address.toLowerCase());
  const live = Boolean(view && view.syntect !== ZERO_ADDRESS);

  async function act(fn: () => Promise<unknown>) {
    setErr("");
    try {
      await fn();
      await load();
    } catch (error) {
      if (!wallet.error) setErr(error instanceof Error ? error.message.slice(0, 180) : "Rejected.");
    }
  }

  return (
    <article className="rounded-2xl border border-line bg-ink-2 p-5">
      <p className="text-xs text-phosphor">{t("pressTitle")}</p>
      <h2 className="mt-2 font-display text-4xl text-paper">SyntectPress</h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-bone">{t("pressHint")}</p>

      {press ? (
        <p className="mt-4 break-all text-sm text-paper">
          <a className="hover:text-phosphor" href={explorerAddress(press)} target="_blank" rel="noreferrer">
            {press}
          </a>
        </p>
      ) : (
        <p className="mt-4 text-sm text-muted">{t("noPress")}</p>
      )}

      {view && (
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Stat k={t("pot")} v={`${formatEth(view.pot)} ETH`} />
          <Stat k={t("deskReserve")} v={`${formatEth(view.desk)} ETH`} />
          <Stat k={t("pending")} v={`${formatEth(view.pendingEth)} ETH`} />
          <Stat k={t("gift")} v={view.giftWei === 0n ? "—" : `${formatEth(view.giftWei)} ETH`} />
        </dl>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {!wallet.address && (
          <button type="button" className="min-h-11 rounded-full bg-phosphor px-5 text-sm text-ink" onClick={() => void wallet.connect()}>
            {t("connect")}
          </button>
        )}
        {wallet.address && !press && (
          <button
            type="button"
            disabled={wallet.busy}
            className="min-h-11 rounded-full bg-phosphor px-5 text-sm text-ink disabled:opacity-50"
            onClick={() => void act(() => wallet.deploy())}
          >
            {t("deploy")}
          </button>
        )}
        {press && view && view.pendingEth > 0n && (
          <button
            type="button"
            disabled={wallet.busy || !wallet.address}
            className="min-h-11 rounded-full border border-line px-5 text-sm text-paper disabled:opacity-50"
            onClick={() => void act(() => wallet.send(press as `0x${string}`, txData("pull")))}
          >
            {t("pullEth")}
          </button>
        )}
        {press && view && view.pairToken !== ZERO_ADDRESS && view.pendingToken > 0n && (
          <button
            type="button"
            disabled={wallet.busy || !wallet.address}
            className="min-h-11 rounded-full border border-line px-5 text-sm text-paper disabled:opacity-50"
            onClick={() => void act(() => wallet.send(press as `0x${string}`, txData("pullToken")))}
          >
            {t("pullToken")}
          </button>
        )}
        {owner && press && view && view.desk > 0n && wallet.address && (
          <button
            type="button"
            disabled={wallet.busy}
            className="min-h-11 rounded-full border border-line px-5 text-sm text-paper disabled:opacity-50"
            onClick={() => void act(() => wallet.send(press as `0x${string}`, txData("withdrawDesk", [wallet.address])))}
          >
            {t("withdrawDesk")}
          </button>
        )}
      </div>

      {owner && press && view && !live && (
        <label className="mt-4 block text-xs text-muted">
          {t("setSwitch")}
          <span className="mt-2 flex gap-2">
            <input
              value={token}
              onChange={(e) => setToken(e.target.value.trim())}
              placeholder="0x"
              className="min-h-11 min-w-0 flex-1 rounded-full border border-line bg-ink px-4 text-sm text-paper"
            />
            <button
              type="button"
              disabled={wallet.busy || !isAddress(token)}
              className="min-h-11 rounded-full bg-phosphor px-4 text-sm text-ink disabled:opacity-50"
              onClick={() => void act(() => wallet.send(press as `0x${string}`, txData("setSyntect", [token])))}
            >
              setSyntect
            </button>
          </span>
        </label>
      )}

      {owner && press && view && view.pairToken === ZERO_ADDRESS && (
        <label className="mt-4 block text-xs text-muted">
          {t("setPair")}
          <span className="mt-2 flex gap-2">
            <input
              value={pair}
              onChange={(e) => setPair(e.target.value.trim())}
              placeholder="0x"
              className="min-h-11 min-w-0 flex-1 rounded-full border border-line bg-ink px-4 text-sm text-paper"
            />
            <button
              type="button"
              disabled={wallet.busy || !isAddress(pair)}
              className="min-h-11 rounded-full border border-line px-4 text-sm text-paper disabled:opacity-50"
              onClick={() => void act(() => wallet.send(press as `0x${string}`, txData("setPair", [pair])))}
            >
              setPair
            </button>
          </span>
        </label>
      )}

      {owner && press && view && (
        <label className="mt-4 block text-xs text-muted">
          {t("setGift")} · ETH
          <span className="mt-2 flex gap-2">
            <input
              value={gift}
              onChange={(e) => setGift(e.target.value.trim())}
              className="min-h-11 w-32 rounded-full border border-line bg-ink px-4 text-sm text-paper"
            />
            <button
              type="button"
              disabled={wallet.busy}
              className="min-h-11 rounded-full border border-line px-4 text-sm text-paper disabled:opacity-50"
              onClick={() =>
                void act(() =>
                  wallet.send(
                    press as `0x${string}`,
                    txData("setTerms", [parseEth(gift), view.minHold, view.giftBps, view.window]),
                  ),
                )
              }
            >
              {t("setGift")}
            </button>
          </span>
        </label>
      )}

      {!LAUNCH.press && (
        <label className="mt-4 block text-xs text-muted">
          {t("remember")}
          <span className="mt-2 flex gap-2">
            <input
              value={pasted}
              onChange={(e) => setPasted(e.target.value.trim())}
              placeholder="0x"
              className="min-h-11 min-w-0 flex-1 rounded-full border border-line bg-ink px-4 text-sm text-paper"
            />
            <button
              type="button"
              disabled={!isAddress(pasted)}
              className="min-h-11 rounded-full border border-line px-4 text-sm text-paper disabled:opacity-50"
              onClick={() => {
                rememberPress(pasted);
                void load();
              }}
            >
              {t("remember")}
            </button>
          </span>
        </label>
      )}

      {live && view && <p className="mt-4 break-all text-xs text-muted">setSyntect · {shortAddress(view.syntect)}</p>}
      <p className="mt-4 text-xs leading-relaxed text-muted">{t("terms")}</p>
      {(err || wallet.error) && <p className="mt-3 text-xs text-keyword">{err || wallet.error}</p>}
    </article>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-xl border border-line bg-ink p-3">
      <dt className="text-xs text-muted">{k}</dt>
      <dd className="mt-1 text-paper">{v}</dd>
    </div>
  );
}
