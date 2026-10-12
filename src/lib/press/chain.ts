import { decodeFunctionResult, encodeDeployData, encodeFunctionData, type Hex } from "viem";
import { LAUNCH } from "@/lib/launch";
import { PRESS_ABI, PRESS_BYTECODE } from "./artifact";

export const CHAIN_ID = 4663;
export const CHAIN_HEX = "0x1237";
export const RPC = "https://rpc.mainnet.chain.robinhood.com";
export const EXPLORER = "https://robinhoodchain.blockscout.com";
const PRESS_KEY = "syntect.press";
const ZERO = "0x0000000000000000000000000000000000000000";

const ERC20_BALANCE = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
] as const;

export function isAddress(value: string): value is `0x${string}` {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

export function shortAddress(value: string): string {
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

export function rememberedPress(): string {
  if (typeof localStorage === "undefined") return "";
  const saved = localStorage.getItem(PRESS_KEY) ?? "";
  return isAddress(saved) ? saved : "";
}

export function activePress(): `0x${string}` | "" {
  if (isAddress(LAUNCH.press)) return LAUNCH.press;
  const saved = rememberedPress();
  return isAddress(saved) ? saved : "";
}

export function rememberPress(address: string) {
  if (!isAddress(address)) return;
  localStorage.setItem(PRESS_KEY, address);
}

export function formatEth(wei: bigint): string {
  const whole = wei / 10n ** 18n;
  const frac = (wei % 10n ** 18n).toString().padStart(18, "0").slice(0, 6).replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : `${whole}`;
}

export function parseEth(input: string): bigint {
  const s = input.trim();
  if (!/^\d+(\.\d{1,18})?$/.test(s)) throw new Error("Enter an ETH amount.");
  const [w, f = ""] = s.split(".");
  return BigInt(w) * 10n ** 18n + BigInt(f.padEnd(18, "0"));
}

async function rpc(method: string, params: unknown[]): Promise<unknown> {
  const res = await fetch(RPC, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const json = (await res.json()) as { result?: unknown; error?: { message?: string } };
  if (json.error) throw new Error(json.error.message || "The chain did not answer.");
  return json.result;
}

export function txData(functionName: string, args: readonly unknown[] = []): Hex {
  return encodeFunctionData({ abi: PRESS_ABI, functionName, args } as never);
}

export function deployData(owner: `0x${string}`): Hex {
  return encodeDeployData({ abi: PRESS_ABI, bytecode: PRESS_BYTECODE, args: [owner] });
}

async function readValue(press: `0x${string}`, functionName: string, args: readonly unknown[] = []): Promise<unknown> {
  const data = txData(functionName, args);
  const raw = (await rpc("eth_call", [{ to: press, data }, "latest"])) as string;
  return decodeFunctionResult({ abi: PRESS_ABI, functionName, data: raw as Hex } as never);
}

export type PressView = {
  owner: `0x${string}`;
  syntect: `0x${string}`;
  pairToken: `0x${string}`;
  pot: bigint;
  desk: bigint;
  giftWei: bigint;
  giftBps: number;
  minHold: bigint;
  window: bigint;
  pendingEth: bigint;
  pendingToken: bigint;
  lastClaim: bigint;
  hold: bigint;
};

export async function readPress(press: `0x${string}`, holder?: `0x${string}` | null): Promise<PressView> {
  const [owner, syntect, pairToken, pot, desk, giftWei, giftBps, minHold, window, pendingEth, pendingToken, lastClaim] =
    await Promise.all([
      readValue(press, "owner"),
      readValue(press, "syntect"),
      readValue(press, "pairToken"),
      readValue(press, "pot"),
      readValue(press, "desk"),
      readValue(press, "giftWei"),
      readValue(press, "giftBps"),
      readValue(press, "minHold"),
      readValue(press, "window"),
      readValue(press, "pendingEth"),
      readValue(press, "pendingToken"),
      holder ? readValue(press, "lastClaim", [holder]) : Promise.resolve(0n),
    ]);

  let hold = 0n;
  if (holder && typeof syntect === "string" && syntect !== ZERO) {
    const data = encodeFunctionData({ abi: ERC20_BALANCE, functionName: "balanceOf", args: [holder] });
    const raw = (await rpc("eth_call", [{ to: syntect, data }, "latest"])) as string;
    hold = BigInt(raw);
  }

  return {
    owner: owner as `0x${string}`,
    syntect: syntect as `0x${string}`,
    pairToken: pairToken as `0x${string}`,
    pot: pot as bigint,
    desk: desk as bigint,
    giftWei: giftWei as bigint,
    giftBps: Number(giftBps),
    minHold: minHold as bigint,
    window: window as bigint,
    pendingEth: pendingEth as bigint,
    pendingToken: pendingToken as bigint,
    lastClaim: lastClaim as bigint,
    hold,
  };
}

export function explorerAddress(address: string): string {
  return `${EXPLORER}/address/${address}`;
}

export function explorerTx(hash: string): string {
  return `${EXPLORER}/tx/${hash}`;
}

export const ZERO_ADDRESS = ZERO;
