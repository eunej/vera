#!/usr/bin/env node
/**
 * Generate a disposable Solana Devnet keypair for Vera's agent wallet.
 * Never commit the private key. Fund with Devnet SOL + Devnet USDC before live payments.
 */

import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";

const kp = Keypair.generate();
const secret = bs58.encode(kp.secretKey);
const pubkey = kp.publicKey.toBase58();

console.log(`
Vera Devnet agent wallet (DISPOSABLE)

Public key:
  ${pubkey}

Private key (base58) — server only:
  ${secret}

Add to .env.local:
  SOLANA_PRIVATE_KEY=${secret}
  SOLANA_PAY_TO=${pubkey}

Fund on Devnet:
  1) SOL for fees:  https://faucet.solana.com/  (paste pubkey, Devnet)
  2) USDC: use a Devnet USDC faucet or circle faucet for mint
     4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU

Never expose SOLANA_PRIVATE_KEY to the browser.
`);
