/**
 * Proof: Vera controls whether money may move.
 *
 * Call graph under test:
 *   runVeraProcurement → makeProcurementDecision → POLICY
 *     → pay() only if APPROVE (or ASK + confirmAsk) and under max
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { runVeraProcurement } from "@/lib/x402/procure";
import {
  makeProcurementDecision,
  type PurchaseIntent,
} from "@/lib/x402/decision";
import type { LivePaymentResult } from "@/lib/x402/client";

function mockPayOk(): LivePaymentResult {
  return {
    ok: true,
    resource: { ok: true },
    transaction: "test-sig",
    explorerUrl: "https://explorer.solana.com/tx/test-sig?cluster=devnet",
    network: "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1",
  };
}

describe("Vera payment control — x402 invocation gate", () => {
  it("Test case 1: mission-aligned SOL data → APPROVE → x402 called exactly once", async () => {
    let payCalls = 0;
    const intent: PurchaseIntent = {
      missionId: "mission-depin-1",
      mission: "Research Solana DePIN projects",
      purpose: "Historical SOL market data",
      requestedProvider: "MarketData Pro",
      requestedPrice: 0.08,
      remainingBudgetUsd: 4.84,
    };

    const decision = makeProcurementDecision(intent);
    assert.equal(decision.policyDecision, "APPROVE");
    assert.equal(decision.recommendedProvider, "MarketData Lite");
    assert.equal(decision.recommendedPrice, 0.02);

    const result = await runVeraProcurement(
      { intent, maxPaymentUsd: 0.1 },
      {
        pay: async () => {
          payCalls += 1;
          return mockPayOk();
        },
      }
    );

    assert.equal(result.decision.policyDecision, "APPROVE");
    assert.equal(result.payment?.status, "settled");
    assert.equal(payCalls, 1, "x402 must be called exactly once on APPROVE");
  });

  it("Test case 2: Premium Gaming API $3.20 → BLOCK → x402 called zero times", async () => {
    let payCalls = 0;
    const intent: PurchaseIntent = {
      missionId: "mission-depin-1",
      mission: "Research Solana DePIN projects",
      purpose: "Premium gaming data subscription",
      requestedProvider: "Premium Gaming API",
      requestedPrice: 3.2,
      remainingBudgetUsd: 4.84,
    };

    const decision = makeProcurementDecision(intent);
    assert.equal(decision.policyDecision, "BLOCK");

    const result = await runVeraProcurement(
      { intent },
      {
        pay: async () => {
          payCalls += 1;
          return mockPayOk();
        },
      }
    );

    assert.equal(result.decision.policyDecision, "BLOCK");
    assert.equal(result.payment?.status, "blocked");
    assert.equal(payCalls, 0, "x402 must not run on BLOCK");
  });

  it("Test case 3: approved amount exceeds policy maximum → BLOCK → x402 called zero times", async () => {
    let payCalls = 0;
    const intent: PurchaseIntent = {
      missionId: "mission-depin-1",
      mission: "Research Solana DePIN projects",
      purpose: "Historical SOL market data",
      requestedProvider: "MarketData Pro",
      requestedPrice: 0.08,
      remainingBudgetUsd: 4.84,
    };

    // Lite is $0.02 — set configured maximum below that.
    const result = await runVeraProcurement(
      { intent, maxPaymentUsd: 0.01 },
      {
        pay: async () => {
          payCalls += 1;
          return mockPayOk();
        },
      }
    );

    assert.equal(result.decision.policyDecision, "BLOCK");
    assert.equal(result.payment?.status, "blocked");
    assert.match(
      result.payment?.status === "blocked" ? result.payment.message : "",
      /policy maximum/i
    );
    assert.equal(payCalls, 0, "x402 must not run when over policy maximum");
  });

  it("ASK without confirmAsk → x402 called zero times", async () => {
    let payCalls = 0;
    const intent: PurchaseIntent = {
      missionId: "mission-depin-1",
      mission: "Research Solana DePIN projects",
      purpose: "Historical SOL market data",
      requestedProvider: "MarketData Pro",
      requestedPrice: 0.08,
      remainingBudgetUsd: 4.84,
      scenario: "ask",
    };

    assert.equal(makeProcurementDecision(intent).policyDecision, "ASK");

    const result = await runVeraProcurement(
      { intent, confirmAsk: false },
      {
        pay: async () => {
          payCalls += 1;
          return mockPayOk();
        },
      }
    );

    assert.equal(result.payment?.status, "ask");
    assert.equal(payCalls, 0, "x402 must not run on unanswered ASK");
  });

  it("ASK with confirmAsk → x402 called exactly once", async () => {
    let payCalls = 0;
    const intent: PurchaseIntent = {
      missionId: "mission-depin-1",
      mission: "Research Solana DePIN projects",
      purpose: "Historical SOL market data",
      requestedProvider: "MarketData Pro",
      requestedPrice: 0.08,
      remainingBudgetUsd: 4.84,
      scenario: "ask",
    };

    const result = await runVeraProcurement(
      { intent, confirmAsk: true, maxPaymentUsd: 0.1 },
      {
        pay: async () => {
          payCalls += 1;
          return mockPayOk();
        },
      }
    );

    assert.equal(result.payment?.status, "settled");
    assert.equal(payCalls, 1);
  });

  it("Expensive provider → APPROVE Lite → x402 once", async () => {
    let payCalls = 0;
    const intent: PurchaseIntent = {
      missionId: "mission-depin-1",
      mission: "Research Solana DePIN projects",
      purpose: "Historical SOL market data",
      requestedProvider: "PremiumData",
      requestedPrice: 0.4,
      remainingBudgetUsd: 4.84,
      scenario: "expensive",
    };

    const decision = makeProcurementDecision(intent);
    assert.equal(decision.policyDecision, "APPROVE");
    assert.equal(decision.recommendedProvider, "MarketData Lite");

    const result = await runVeraProcurement(
      { intent, maxPaymentUsd: 0.1 },
      {
        pay: async () => {
          payCalls += 1;
          return mockPayOk();
        },
      }
    );

    assert.equal(result.payment?.status, "settled");
    assert.equal(payCalls, 1);
  });
});
