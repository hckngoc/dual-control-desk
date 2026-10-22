import { createHash, randomUUID } from "node:crypto";
export const LANES = ["finance-approver", "compliance-approver"] as const;
export type Lane = (typeof LANES)[number];
export interface Identity {
  sub: string;
  name: string;
  roles: string[];
}
export interface Expense {
  id: string;
  title: string;
  payee: string;
  account: string;
  amount: number;
  currency: "VND";
  evidence: string;
  requester: string;
  createdAt: string;
}
export interface Receipt {
  token: string;
  proof: string;
  lane: Lane;
}
export class DeskError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function demand(
  ok: unknown,
  status: number,
  message: string,
): asserts ok {
  if (!ok) throw new DeskError(status, message);
}
export function role(who: Identity, r: string) {
  demand(who.roles.includes(r), 403, `Required realm role: ${r}`);
}
export function digest(e: Expense) {
  return createHash("sha256")
    .update(
      JSON.stringify([
        e.id,
        e.title,
        e.payee,
        e.account,
        e.amount,
        e.currency,
        e.evidence,
        e.requester,
        e.createdAt,
      ]),
    )
    .digest("hex");
}
export function createExpense(who: Identity, input: unknown): Expense {
  role(who, "requester");
  const i = input as Record<string, unknown>;
  demand(i && typeof i === "object", 400, "Invalid expense");
  const text = (k: string, min: number, max: number) => {
    const v = i[k];
    demand(
      typeof v === "string" && v.trim().length >= min && v.trim().length <= max,
      400,
      `Invalid ${k}`,
    );
    return v.trim();
  };
  demand(
    Number.isSafeInteger(i.amount) &&
      Number(i.amount) >= 10000000 &&
      Number(i.amount) <= 100000000000,
    400,
    "Amount must be an integer from 10,000,000 to 100,000,000,000 VND",
  );
  return {
    id: randomUUID(),
    title: text("title", 3, 120),
    payee: text("payee", 3, 100),
    account: text("account", 3, 80),
    amount: Number(i.amount),
    currency: "VND",
    evidence: text("evidence", 3, 180),
    requester: who.sub,
    createdAt: new Date().toISOString(),
  };
}
export function canApprove(
  who: Identity,
  e: Expense,
  lane: string,
): asserts lane is Lane {
  demand(LANES.includes(lane as Lane), 400, "Unknown approval lane");
  role(who, lane);
  demand(
    who.sub !== e.requester,
    403,
    "Requester cannot approve their own expense",
  );
}
export function approvalPath(e: Expense, lane: Lane) {
  return `/api/expenses/${e.id}/${digest(e)}/${lane}`;
}
export function identity(jwt: Record<string, unknown>): Identity {
  demand(
    typeof jwt.sub === "string" && jwt.sub.length > 0,
    401,
    "Missing subject",
  );
  const roles = (jwt.realm_access as { roles?: unknown })?.roles;
  return {
    sub: jwt.sub,
    name:
      typeof jwt.preferred_username === "string"
        ? jwt.preferred_username
        : jwt.sub.slice(0, 12),
    roles: Array.isArray(roles)
      ? roles.filter((r): r is string => typeof r === "string")
      : [],
  };
}
export function assertDualApproval(
  e: Expense,
  approvals: { who: Identity; lane: Lane }[],
) {
  demand(approvals.length === 2, 412, "Two independent approvals required");
  demand(
    new Set(approvals.map((a) => a.lane)).size === 2,
    412,
    "Both finance and compliance approvals required",
  );
  demand(
    new Set(approvals.map((a) => a.who.sub)).size === 2,
    412,
    "One person cannot fill both approval lanes",
  );
  for (const a of approvals) canApprove(a.who, e, a.lane);
}
