import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createExpense,
  digest,
  identity,
  canApprove,
  assertDualApproval,
  type Identity,
} from "../src/lib/desk/domain";
const requester: Identity = {
  sub: "requester",
  name: "Linh",
  roles: ["requester"],
};
const input = {
  title: "Clinic equipment",
  payee: "Synthetic supplier",
  account: "DEMO-001",
  amount: 75000000,
  evidence: "SYNTHETIC-INVOICE",
};
test("valid expense uses immutable server-generated requester and ID", () => {
  const e = createExpense(requester, { ...input, requester: "attacker" });
  assert.equal(e.requester, "requester");
  assert.equal(e.currency, "VND");
  assert.ok(e.id);
});
test("negative, decimal, below threshold and overflow amounts are rejected", () => {
  for (const amount of [-1, 100.5, 9999999, 1e15, "75000000"])
    assert.throws(() => createExpense(requester, { ...input, amount }));
});
test("missing role and invalid form rejected", () => {
  assert.throws(() => createExpense({ ...requester, roles: [] }, input));
  assert.throws(() => createExpense(requester, { ...input, title: " " }));
  assert.throws(() => createExpense(requester, null));
});
test("every payment detail changes digest", () => {
  const e = createExpense(requester, input);
  for (const [k, v] of Object.entries({
    amount: 80000000,
    payee: "Another supplier",
    account: "OTHER",
    evidence: "OTHER",
    requester: "OTHER",
    id: "OTHER",
    title: "OTHER",
    createdAt: "OTHER",
  }))
    assert.notEqual(digest(e), digest({ ...e, [k]: v }));
});
test("client-scoped lookalike role cannot grant desk authority", () => {
  const w = identity({
    sub: "x",
    resource_access: { evil: { roles: ["finance-approver"] } },
  });
  assert.deepEqual(w.roles, []);
  assert.throws(() =>
    canApprove(w, createExpense(requester, input), "finance-approver"),
  );
});
test("self-approval and a single person in two lanes fail", () => {
  const e = createExpense(requester, input);
  assert.throws(() =>
    canApprove(
      { ...requester, roles: ["finance-approver"] },
      e,
      "finance-approver",
    ),
  );
  const w = {
    sub: "one",
    name: "One",
    roles: ["finance-approver", "compliance-approver"],
  };
  assert.throws(() =>
    assertDualApproval(e, [
      { who: w, lane: "finance-approver" },
      { who: w, lane: "compliance-approver" },
    ]),
  );
});
test("two distinct reviewers with correct roles pass; missing/duplicate/wrong lanes fail", () => {
  const e = createExpense(requester, input);
  const a = {
    who: { sub: "a", name: "A", roles: ["finance-approver"] },
    lane: "finance-approver" as const,
  };
  const b = {
    who: { sub: "b", name: "B", roles: ["compliance-approver"] },
    lane: "compliance-approver" as const,
  };
  assert.doesNotThrow(() => assertDualApproval(e, [a, b]));
  for (const list of [
    [],
    [a],
    [a, a],
    [a, { ...b, who: { ...b.who, roles: [] } }],
  ])
    assert.throws(() => assertDualApproval(e, list));
});
