import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Hex } from "viem";
import { CHAIN_HEX, CHAIN_ID, EXPLORER, RPC, deployData, isAddress, rememberPress } from "./chain";

type Eth = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
};

function getEth(): Eth | null {
  if (typeof window === "undefined") return null;
  const eth = (window as unknown as { ethereum?: Eth }).ethereum;
  return eth ?? null;
}

function messageOf(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) return String((err as { message: unknown }).message).slice(0, 180);
  return "The wallet rejected it.";
}

async function ensureChain(eth: Eth) {
  const hex = (await eth.request({ method: "eth_chainId" })) as string;
  if (Number(hex) === CHAIN_ID) return;
  try {
    await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: CHAIN_HEX }] });
  } catch (err) {
    const code = (err as { code?: number }).code;
    if (code !== 4902) throw err;
    await eth.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: CHAIN_HEX,
          chainName: "Robinhood Chain",
          nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
          rpcUrls: [RPC],
          blockExplorerUrls: [EXPLORER],
        },
      ],
    });
  }
}

async function waitReceipt(hash: string): Promise<string | null> {
  for (let i = 0; i < 40; i++) {
    const res = await fetch(RPC, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getTransactionReceipt", params: [hash] }),
    });
    const json = (await res.json()) as { result?: { contractAddress?: string | null; status?: string } | null };
    if (json.result) {
      if (json.result.status === "0x0") throw new Error("The transaction reverted.");
      return json.result.contractAddress ?? null;
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error("The receipt has not landed yet.");
}

type Wallet = {
  address: `0x${string}` | null;
  chainId: number | null;
  busy: boolean;
  error: string;
  connect: () => Promise<void>;
  disconnect: () => void;
  send: (to: `0x${string}`, data: Hex) => Promise<string>;
  deploy: () => Promise<`0x${string}`>;
};

const Ctx = createContext<Wallet | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<`0x${string}` | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    const eth = getEth();
    if (!eth) return;
    try {
      const accounts = (await eth.request({ method: "eth_accounts" })) as string[];
      const hex = (await eth.request({ method: "eth_chainId" })) as string;
      const first = accounts[0];
      setAddress(first && isAddress(first) ? first : null);
      setChainId(Number(hex));
    } catch {
      /* the wallet can be locked */
    }
  }, []);

  useEffect(() => {
    void refresh();
    const eth = getEth();
    if (!eth?.on) return;
    const onAccounts = (accounts: unknown) => {
      const list = Array.isArray(accounts) ? (accounts as string[]) : [];
      const first = list[0];
      setAddress(first && isAddress(first) ? first : null);
    };
    const onChain = (hex: unknown) => setChainId(Number(hex));
    eth.on("accountsChanged", onAccounts);
    eth.on("chainChanged", onChain);
    return () => {
      eth.removeListener?.("accountsChanged", onAccounts);
      eth.removeListener?.("chainChanged", onChain);
    };
  }, [refresh]);

  const connect = useCallback(async () => {
    setError("");
    const eth = getEth();
    if (!eth) {
      setError("No wallet in this browser.");
      return;
    }
    try {
      const accounts = (await eth.request({ method: "eth_requestAccounts" })) as string[];
      const first = accounts[0];
      if (!first || !isAddress(first)) return;
      setAddress(first);
      await ensureChain(eth);
      const hex = (await eth.request({ method: "eth_chainId" })) as string;
      setChainId(Number(hex));
    } catch (err) {
      setError(messageOf(err));
    }
  }, []);

  const disconnect = useCallback(() => setAddress(null), []);

  const send = useCallback(
    async (to: `0x${string}`, data: Hex) => {
      const eth = getEth();
      if (!eth || !address) throw new Error("Connect a wallet.");
      setBusy(true);
      setError("");
      try {
        await ensureChain(eth);
        return (await eth.request({
          method: "eth_sendTransaction",
          params: [{ from: address, to, data }],
        })) as string;
      } catch (err) {
        setError(messageOf(err));
        throw err;
      } finally {
        setBusy(false);
      }
    },
    [address],
  );

  const deploy = useCallback(async () => {
    const eth = getEth();
    if (!eth || !address) throw new Error("Connect a wallet.");
    setBusy(true);
    setError("");
    try {
      await ensureChain(eth);
      const hash = (await eth.request({
        method: "eth_sendTransaction",
        params: [{ from: address, data: deployData(address) }],
      })) as string;
      const created = await waitReceipt(hash);
      if (!created || !isAddress(created)) throw new Error("The deploy did not return an address.");
      rememberPress(created);
      return created;
    } catch (err) {
      setError(messageOf(err));
      throw err;
    } finally {
      setBusy(false);
    }
  }, [address]);

  const value = useMemo(
    () => ({ address, chainId, busy, error, connect, disconnect, send, deploy }),
    [address, chainId, busy, error, connect, disconnect, send, deploy],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWallet(): Wallet {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("wallet");
  return ctx;
}
