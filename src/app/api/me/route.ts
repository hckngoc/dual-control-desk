import { withAuth } from "@/lib/auth/protect";
import { identity } from "@/lib/desk/domain";
export const GET = withAuth(async (_req, jwt) =>
  Response.json({ identity: identity(jwt), expiresAt: jwt.exp }),
);
