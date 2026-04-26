export type ExecutionVenue = "okx_onchain_os" | "cex" | "dex" | "broker" | "manual";

export type ExecutionEvidence =
  | {
      kind: "onchain";
      txHash: string;
      chainIndex: string;
      blockNumber?: number;
      confirmations?: number;
      status: "submitted" | "confirmed" | "failed";
    }
  | {
      kind: "cex_order";
      orderId: string;
      clientOrderId?: string;
      fillId?: string;
      status: "submitted" | "filled" | "partial" | "cancelled" | "failed";
    }
  | {
      kind: "receipt";
      receiptId: string;
      status: "pending" | "settled" | "failed";
    }
  | {
      kind: "balance_snapshot";
      venue: ExecutionVenue;
      accountId?: string;
      capturedAt: string;
      balances: Array<{ asset: string; amount: string; usdValue?: string }>;
    };

export interface ExecutionIntent {
  id: string;
  venue: ExecutionVenue;
  symbol: string;
  side: "buy" | "sell";
  quantity: string;
  tradingMode: "paper" | "live";
  requestedAt: string;
}

export interface ExecutionRecord {
  intent: ExecutionIntent;
  evidence: ExecutionEvidence[];
  createdAt: string;
  updatedAt: string;
}

export function normalizeExecutionEvidence(input: unknown): ExecutionEvidence {
  const value = asRecord(input);
  const kind = asString(value.kind, "kind");

  switch (kind) {
    case "onchain":
      return {
        kind,
        txHash: asString(value.txHash, "txHash"),
        chainIndex: asString(value.chainIndex, "chainIndex"),
        blockNumber: asOptionalNonNegativeInteger(value.blockNumber, "blockNumber"),
        confirmations: asOptionalNonNegativeInteger(value.confirmations, "confirmations"),
        status: asOneOf(value.status, "status", ["submitted", "confirmed", "failed"]),
      };
    case "cex_order":
      return {
        kind,
        orderId: asString(value.orderId, "orderId"),
        clientOrderId: asOptionalString(value.clientOrderId, "clientOrderId"),
        fillId: asOptionalString(value.fillId, "fillId"),
        status: asOneOf(value.status, "status", ["submitted", "filled", "partial", "cancelled", "failed"]),
      };
    case "receipt":
      return {
        kind,
        receiptId: asString(value.receiptId, "receiptId"),
        status: asOneOf(value.status, "status", ["pending", "settled", "failed"]),
      };
    case "balance_snapshot":
      return {
        kind,
        venue: asExecutionVenue(value.venue),
        accountId: asOptionalString(value.accountId, "accountId"),
        capturedAt: asTimestamp(value.capturedAt, "capturedAt"),
        balances: asBalances(value.balances),
      };
    default:
      throw new Error(`Unsupported execution evidence kind: ${kind}`);
  }
}

function asRecord(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Execution evidence must be an object.");
  }

  return input as Record<string, unknown>;
}

function asString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Execution evidence field "${field}" must be a non-empty string.`);
  }

  return value;
}

function asOptionalString(value: unknown, field: string): string | undefined {
  if (value === undefined) return undefined;
  return asString(value, field);
}

function asOptionalNonNegativeInteger(value: unknown, field: string): number | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "number" || !Number.isFinite(value) || !Number.isInteger(value) || value < 0) {
    throw new Error(`Execution evidence field "${field}" must be a non-negative integer.`);
  }

  return value;
}

function asOneOf<const T extends string>(value: unknown, field: string, allowed: readonly T[]): T {
  const next = asString(value, field);
  if (!allowed.includes(next as T)) {
    throw new Error(`Execution evidence field "${field}" must be one of: ${allowed.join(", ")}.`);
  }

  return next as T;
}

function asExecutionVenue(value: unknown): ExecutionVenue {
  return asOneOf(value, "venue", ["okx_onchain_os", "cex", "dex", "broker", "manual"]);
}

function asTimestamp(value: unknown, field: string): string {
  const timestamp = asString(value, field);
  if (Number.isNaN(Date.parse(timestamp))) {
    throw new Error(`Execution evidence field "${field}" must be a parseable timestamp.`);
  }

  return timestamp;
}

function asBalances(value: unknown): Array<{ asset: string; amount: string; usdValue?: string }> {
  if (!Array.isArray(value)) {
    throw new Error('Execution evidence field "balances" must be an array.');
  }

  return value.map((entry) => {
    const record = asRecord(entry);
    const usdValue = asOptionalString(record.usdValue, "balances.usdValue");
    return {
      asset: asString(record.asset, "balances.asset"),
      amount: asString(record.amount, "balances.amount"),
      ...(usdValue === undefined ? {} : { usdValue }),
    };
  });
}
