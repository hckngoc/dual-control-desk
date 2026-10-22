import { withAuth } from "@/lib/auth/protect";
import { extractToken } from "@/lib/auth/tideJWT";
import { identity, role, canApprove, digest, demand } from "@/lib/desk/domain";
import {
  getExpense,
  saveApproval,
  receipts,
  paid,
  audit,
} from "@/lib/desk/store";
import { result } from "@/lib/desk/http";
export const runtime = "nodejs";
export const POST = withAuth(async (req, jwt) =>
  result(async () => {
    const [id, hash, action] = new URL(req.url).pathname.split("/").slice(-3);
    const who = identity(jwt);
    const { expense: e, status } = getExpense(id);
    demand(hash === digest(e), 409, "Expense digest mismatch");
    if (action === "execute") {
      role(who, "payment-executor");
      const response = await fetch(
        `${process.env.RAIL_URL ?? "http://127.0.0.1:4100"}/payments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ expense: e, receipts: receipts(id) }),
          signal: AbortSignal.timeout(10000),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        audit(who.sub, "PAYMENT_BLOCKED", id, String(data.error));
        return Response.json(data, { status: response.status });
      }
      paid(id, data.receipt, who.sub);
      return Response.json(data);
    }
    demand(status === "PENDING", 409, "Expense already paid");
    canApprove(who, e, action);
    saveApproval(id, who.sub, action, {
      lane: action,
      token: extractToken(req.headers.get("authorization")),
      proof: req.headers.get("dpop")!,
    });
    return Response.json({ approved: true, lane: action });
  }),
);
