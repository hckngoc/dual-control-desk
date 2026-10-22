import { withAuth } from "@/lib/auth/protect";
import { identity, demand } from "@/lib/desk/domain";
import { events } from "@/lib/desk/store";
import { result } from "@/lib/desk/http";
export const GET = withAuth(async (_req, jwt) =>
  result(async () => {
    const w = identity(jwt);
    demand(
      w.roles.some((r) =>
        [
          "auditor",
          "finance-approver",
          "compliance-approver",
          "payment-executor",
        ].includes(r),
      ),
      403,
      "Auditor or reviewer role required",
    );
    return Response.json({ events: events() });
  }),
);
