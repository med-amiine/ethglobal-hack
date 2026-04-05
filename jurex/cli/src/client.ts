import { createPublicClient, createWalletClient, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrumSepolia as arbitrum } from "viem/chains";
import { config } from "./config.js";

export function getPublicClient() {
  return createPublicClient({
    chain: arbitrum,
    transport: http(config.get("rpcUrl")),
  });
}

export function getWalletClient() {
  const key = config.get("privateKey");
  if (!key) throw new Error("No private key configured. Run: jurex init");
  const account = privateKeyToAccount(key as `0x${string}`);
  return {
    client: createWalletClient({
      account,
      chain: arbitrum,
      transport: http(config.get("rpcUrl")),
    }),
    account,
  };
}

export async function api<T = unknown>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const base = config.get("apiUrl");
  const res = await fetch(`${base}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(
      `API ${res.status}: ${typeof err.detail === "string" ? err.detail : JSON.stringify(err.detail)}`
    );
  }
  return res.json() as Promise<T>;
}
