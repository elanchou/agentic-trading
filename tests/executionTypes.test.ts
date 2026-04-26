import assert from "node:assert/strict";
import test from "node:test";

import { normalizeExecutionEvidence } from "../src/server/executionTypes";

test("normalizeExecutionEvidence accepts on-chain evidence", () => {
  const evidence = normalizeExecutionEvidence({
    kind: "onchain",
    txHash: "0xabc123",
    chainIndex: "1",
    blockNumber: 201,
    confirmations: 4,
    status: "confirmed",
  });

  assert.deepEqual(evidence, {
    kind: "onchain",
    txHash: "0xabc123",
    chainIndex: "1",
    blockNumber: 201,
    confirmations: 4,
    status: "confirmed",
  });
});

test("normalizeExecutionEvidence accepts CEX order evidence", () => {
  const evidence = normalizeExecutionEvidence({
    kind: "cex_order",
    orderId: "ord_123",
    clientOrderId: "client_123",
    fillId: "fill_123",
    status: "partial",
  });

  assert.deepEqual(evidence, {
    kind: "cex_order",
    orderId: "ord_123",
    clientOrderId: "client_123",
    fillId: "fill_123",
    status: "partial",
  });
});

test("normalizeExecutionEvidence accepts receipt evidence", () => {
  const evidence = normalizeExecutionEvidence({
    kind: "receipt",
    receiptId: "receipt_123",
    status: "settled",
  });

  assert.deepEqual(evidence, {
    kind: "receipt",
    receiptId: "receipt_123",
    status: "settled",
  });
});

test("normalizeExecutionEvidence accepts balance snapshot evidence", () => {
  const evidence = normalizeExecutionEvidence({
    kind: "balance_snapshot",
    venue: "cex",
    accountId: "acct_123",
    capturedAt: "2026-04-26T12:34:56.000Z",
    balances: [
      { asset: "BTC", amount: "0.5", usdValue: "47000" },
      { asset: "USDT", amount: "1200" },
    ],
  });

  assert.deepEqual(evidence, {
    kind: "balance_snapshot",
    venue: "cex",
    accountId: "acct_123",
    capturedAt: "2026-04-26T12:34:56.000Z",
    balances: [
      { asset: "BTC", amount: "0.5", usdValue: "47000" },
      { asset: "USDT", amount: "1200" },
    ],
  });
});

test("normalizeExecutionEvidence rejects unknown evidence kinds", () => {
  assert.throws(
    () =>
      normalizeExecutionEvidence({
        kind: "mystery",
      }),
    /Unsupported execution evidence kind/,
  );
});

test("normalizeExecutionEvidence rejects invalid venue", () => {
  assert.throws(
    () =>
      normalizeExecutionEvidence({
        kind: "balance_snapshot",
        venue: "dark_pool",
        capturedAt: "2026-04-26T12:34:56.000Z",
        balances: [],
      }),
    /Execution evidence field "venue" must be one of/,
  );
});

test("normalizeExecutionEvidence rejects malformed balances", () => {
  assert.throws(
    () =>
      normalizeExecutionEvidence({
        kind: "balance_snapshot",
        venue: "cex",
        capturedAt: "2026-04-26T12:34:56.000Z",
        balances: [{ asset: "BTC", amount: 1.25 }],
      }),
    /Execution evidence field "balances\.amount" must be a non-empty string/,
  );
});

test("normalizeExecutionEvidence rejects empty required strings", () => {
  assert.throws(
    () =>
      normalizeExecutionEvidence({
        kind: "receipt",
        receiptId: "",
        status: "settled",
      }),
    /Execution evidence field "receiptId" must be a non-empty string/,
  );
});

test("normalizeExecutionEvidence rejects negative numeric fields", () => {
  assert.throws(
    () =>
      normalizeExecutionEvidence({
        kind: "onchain",
        txHash: "0xabc123",
        chainIndex: "1",
        blockNumber: -1,
        confirmations: 2,
        status: "confirmed",
      }),
    /Execution evidence field "blockNumber" must be a non-negative integer/,
  );
});

test("normalizeExecutionEvidence rejects fractional numeric fields", () => {
  assert.throws(
    () =>
      normalizeExecutionEvidence({
        kind: "onchain",
        txHash: "0xabc123",
        chainIndex: "1",
        blockNumber: 10,
        confirmations: 1.5,
        status: "confirmed",
      }),
    /Execution evidence field "confirmations" must be a non-negative integer/,
  );
});

test("normalizeExecutionEvidence rejects unparseable timestamps", () => {
  assert.throws(
    () =>
      normalizeExecutionEvidence({
        kind: "balance_snapshot",
        venue: "cex",
        capturedAt: "not-a-timestamp",
        balances: [],
      }),
    /Execution evidence field "capturedAt" must be a parseable timestamp/,
  );
});
