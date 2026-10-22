import { test } from "node:test";
import assert from "node:assert/strict";
import {
  generateKeyPair,
  exportJWK,
  calculateJwkThumbprint,
  SignJWT,
} from "jose";
import { createHash, randomUUID } from "node:crypto";
import { verifyDpop, MemoryJtiStore } from "../src/lib/auth/verifyDpop";
import {
  createExpense,
  approvalPath,
  type Receipt,
} from "../src/lib/desk/domain";
// Only test processes trust these ephemeral keys. There is no development login or test key in the running app.
const tide = await generateKeyPair("ES256");
const tideJwk = {
  ...(await exportJWK(tide.publicKey)),
  kid: "test-tide",
  alg: "ES256",
};
process.env.CLIENT_ADAPTER = JSON.stringify({
  realm: "test",
  "public-client": true,
  resource: "test-client",
  "auth-server-url": "https://tide.test",
  jwk: { keys: [tideJwk] },
});
const { verifyTideJWT } = await import("../src/lib/auth/tideJWT");
const { verifyPayment } = await import("../src/lib/desk/rail-verify");
const e = createExpense(
  { sub: "requester", name: "Linh", roles: ["requester"] },
  {
    title: "Clinic equipment",
    payee: "Synthetic supplier",
    account: "DEMO-001",
    amount: 75000000,
    evidence: "SYNTHETIC-INVOICE",
  },
);
const origin = "http://localhost:3000";
async function signed(
  sub: string,
  lane: "finance-approver" | "compliance-approver",
  opts: { expired?: boolean; roles?: string[]; iat?: number } = {},
): Promise<Receipt> {
  const pair = await generateKeyPair("ES256");
  const jwk = await exportJWK(pair.publicKey);
  const jkt = await calculateJwkThumbprint(jwk);
  const now = Math.floor(Date.now() / 1000);
  const token = await new SignJWT({
    azp: "test-client",
    realm_access: { roles: opts.roles ?? [lane] },
    cnf: { jkt },
  })
    .setProtectedHeader({ alg: "ES256", kid: "test-tide" })
    .setIssuer("https://tide.test/realms/test")
    .setSubject(sub)
    .setIssuedAt(now)
    .setExpirationTime(now + (opts.expired ? -10 : 120))
    .sign(tide.privateKey);
  const proof = await new SignJWT({
    htm: "POST",
    htu: origin + approvalPath(e, lane),
    ath: createHash("sha256").update(token).digest("base64url"),
  })
    .setProtectedHeader({ alg: "ES256", typ: "dpop+jwt", jwk })
    .setJti(randomUUID())
    .setIssuedAt(opts.iat ?? now)
    .sign(pair.privateKey);
  return { token, proof, lane };
}
function request(
  r: Receipt,
  changes: Partial<{ url: string; method: string; headers: Headers }> = {},
) {
  return {
    url: origin + approvalPath(e, r.lane),
    method: "POST",
    headers: new Headers({ authorization: `DPoP ${r.token}`, dpop: r.proof }),
    ...changes,
  };
}
test("independent rail accepts two authentic operation-bound approvals", async () => {
  const a = await signed("finance", "finance-approver"),
    b = await signed("compliance", "compliance-approver");
  assert.equal((await verifyPayment(e, [a, b], origin)).length, 2);
});
test("forged database status or missing proofs cannot authorize payment", async () => {
  await assert.rejects(
    verifyPayment({ ...e, status: "PAID" } as typeof e, [], origin),
  );
  await assert.rejects(
    verifyPayment(
      e,
      [
        { token: "fake", proof: "fake", lane: "finance-approver" },
        { token: "fake", proof: "fake", lane: "compliance-approver" },
      ],
      origin,
    ),
  );
});
test("tampered amount, account, payee, evidence or request ID invalidates proof", async () => {
  const rs = [
    await signed("a", "finance-approver"),
    await signed("b", "compliance-approver"),
  ];
  for (const [k, v] of Object.entries({
    amount: 80000000,
    account: "EVIL",
    payee: "EVIL",
    evidence: "EVIL",
    id: "EVIL",
  }))
    await assert.rejects(verifyPayment({ ...e, [k]: v }, rs, origin));
});
test("same person, self approval and unauthorized lane fail at independent verifier", async () => {
  await assert.rejects(
    verifyPayment(
      e,
      [
        await signed("a", "finance-approver"),
        await signed("a", "compliance-approver"),
      ],
      origin,
    ),
  );
  await assert.rejects(
    verifyPayment(
      e,
      [
        await signed(e.requester, "finance-approver"),
        await signed("b", "compliance-approver"),
      ],
      origin,
    ),
  );
  await assert.rejects(
    verifyPayment(
      e,
      [
        await signed("a", "finance-approver", { roles: [] }),
        await signed("b", "compliance-approver"),
      ],
      origin,
    ),
  );
});
test("expired access token and stale approval evidence fail", async () => {
  await assert.rejects(
    verifyPayment(
      e,
      [
        await signed("a", "finance-approver", { expired: true }),
        await signed("b", "compliance-approver"),
      ],
      origin,
    ),
  );
  await assert.rejects(
    verifyPayment(
      e,
      [
        await signed("a", "finance-approver", {
          iat: Math.floor(Date.now() / 1000) - 400,
        }),
        await signed("b", "compliance-approver"),
      ],
      origin,
    ),
  );
});
test("DPoP rejects bare Bearer, absent proof, wrong method and wrong target", async () => {
  const r = await signed("a", "finance-approver");
  const c = await verifyTideJWT(r.token);
  for (const changes of [
    {
      headers: new Headers({
        authorization: `Bearer ${r.token}`,
        dpop: r.proof,
      }),
    },
    { headers: new Headers({ authorization: `DPoP ${r.token}` }) },
    { method: "GET" },
    { url: origin + "/other" },
  ])
    await assert.rejects(
      verifyDpop(request(r, changes), r.token, c as { cnf: { jkt: string } }, {
        jtiStore: new MemoryJtiStore(),
        trustForwardedHeaders: false,
      }),
    );
});
test("DPoP replay and mismatched key/token pair fail", async () => {
  const r = await signed("a", "finance-approver");
  const c = await verifyTideJWT(r.token);
  const jtiStore = new MemoryJtiStore();
  await verifyDpop(request(r), r.token, c as { cnf: { jkt: string } }, {
    jtiStore,
  });
  await assert.rejects(
    verifyDpop(request(r), r.token, c as { cnf: { jkt: string } }, {
      jtiStore,
    }),
  );
  const other = await signed("b", "finance-approver");
  await assert.rejects(
    verifyDpop(
      request({ ...other, proof: r.proof }),
      other.token,
      (await verifyTideJWT(other.token)) as { cnf: { jkt: string } },
      { jtiStore: new MemoryJtiStore() },
    ),
  );
});
test("access token signature tampering is rejected", async () => {
  const r = await signed("a", "finance-approver");
  const parts = r.token.split(".");
  parts[1] = Buffer.from(JSON.stringify({ sub: "attacker" })).toString(
    "base64url",
  );
  await assert.rejects(verifyTideJWT(parts.join(".")));
});
