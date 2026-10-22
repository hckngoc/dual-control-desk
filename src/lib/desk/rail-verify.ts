// The independent mock rail distrusts app status, role flags and approval rows.
import { verifyTideJWT } from "../auth/tideJWT";
import { verifyDpop } from "../auth/verifyDpop";
import {
  approvalPath,
  assertDualApproval,
  identity,
  demand,
  type Expense,
  type Receipt,
} from "./domain";
export async function verifyPayment(e: Expense, rs: Receipt[], origin: string) {
  demand(
    e &&
      typeof e.id === "string" &&
      e.currency === "VND" &&
      Number.isSafeInteger(e.amount) &&
      e.amount >= 10000000 &&
      e.amount <= 100000000000,
    400,
    "Invalid payment payload",
  );
  demand(
    Array.isArray(rs) && rs.length === 2,
    412,
    "Two signed approvals required",
  );
  const approvals = [];
  for (const r of rs) {
    const claims = await verifyTideJWT(r.token);
    const who = identity(claims);
    // Revalidation of stored evidence, NOT incoming HTTP authentication. Rail SQLite
    // enforces payment idempotency. Live HTTP routes use a real DPoP replay store.
    await verifyDpop(
      {
        url: origin + approvalPath(e, r.lane),
        method: "POST",
        headers: new Headers({
          authorization: `DPoP ${r.token}`,
          dpop: r.proof,
        }),
      },
      r.token,
      claims as { cnf?: { jkt?: string } },
      {
        trustForwardedHeaders: false,
        jtiStore: { claim: async () => true },
        iatSkewSeconds: 300,
      },
    );
    approvals.push({ who, lane: r.lane });
  }
  assertDualApproval(e, approvals);
  return approvals.map((a) => ({ subject: a.who.sub, lane: a.lane }));
}
