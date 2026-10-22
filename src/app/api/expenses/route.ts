import { withAuth } from "@/lib/auth/protect";
import { identity, createExpense, demand } from "@/lib/desk/domain";
import { listExpenses, saveExpense } from "@/lib/desk/store";
import { result, json } from "@/lib/desk/http";
export const runtime = "nodejs";
export const GET = withAuth(async (_req, jwt) =>
  result(async () => {
    const who = identity(jwt);
    const reviewers = [
      "finance-approver",
      "compliance-approver",
      "payment-executor",
      "auditor",
    ];
    demand(
      who.roles.some((r) => r === "requester" || reviewers.includes(r)),
      403,
      "No desk access",
    );
    const rows = listExpenses();
    return Response.json({
      expenses: who.roles.some((r) => reviewers.includes(r))
        ? rows
        : rows.filter((e) => e.requester === who.sub),
    });
  }),
);
export const POST = withAuth(async (req, jwt) =>
  result(async () => {
    const e = createExpense(identity(jwt), await json(req));
    saveExpense(e);
    return Response.json({ expense: e }, { status: 201 });
  }),
);
