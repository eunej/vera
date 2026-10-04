/** Solana Devnet CAIP-2 network id (x402 V2). */
export const SOLANA_DEVNET =
  "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1" as const;

/** Devnet USDC mint. */
export const DEVNET_USDC_MINT =
  "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU" as const;

/** Public testnet facilitator — supports Solana Devnet exact scheme. */
export const DEFAULT_FACILITATOR_URL = "https://x402.org/facilitator";

export const USDC_DECIMALS = 6;

export function usdcToBaseUnits(amountUsd: number): bigint {
  return BigInt(Math.round(amountUsd * 10 ** USDC_DECIMALS));
}

export function explorerTxUrl(signature: string): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
}
