import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createExpense, type Receipt } from "../src/lib/desk/domain";
process.env.DESK_DB = join(
  mkdtempSync(join(tmpdir(), "dual-desk-test-")),
  "test.sqlite",
);
import {
  saveExpense,
  getExpense,
  saveApproval,
  listExpenses,
  receipts,
  paid,
  events,
} from "../src/lib/desk/store";
const make = () =>
  createExpense(
    { sub: "requester", name: "Linh", roles: ["requester"] },
    {
      title: "Clinic equipment",
      payee: "Synthetic supplier",
      account: "DEMO-001",
      amount: 75000000,
      evidence: "SYNTHETIC-INVOICE",
    },
  );
const proof = (lane: Receipt["lane"]): Receipt => ({
  token: "test-not-a-real-token",
  proof: "test-not-a-real-proof",
  lane,
});
test("SQL transaction blocks second lane for same subject and rolls back", () => {
  const e = make();
  saveExpense(e);
  saveApproval(
    e.id,
    "reviewer-a",
    "finance-approver",
    proof("finance-approver"),
  );
  assert.throws(() =>
    saveApproval(
      e.id,
      "reviewer-a",
      "compliance-approver",
      proof("compliance-approver"),
    ),
  );
  assert.equal(receipts(e.id).length, 1);
  saveApproval(
    e.id,
    "reviewer-b",
    "compliance-approver",
    proof("compliance-approver"),
  );
  assert.equal(receipts(e.id).length, 2);
});
test("renewal replaces one lane and public list never returns signed evidence", () => {
  const e = make();
  saveExpense(e);
  saveApproval(e.id, "a", "finance-approver", proof("finance-approver"));
  saveApproval(e.id, "a", "finance-approver", {
    ...proof("finance-approver"),
    token: "renewed",
  });
  assert.equal(receipts(e.id).length, 1);
  assert.equal(receipts(e.id)[0].token, "renewed");
  const row = listExpenses().find((r) => r.id === e.id)!;
  assert.equal(row.approvals.length, 1);
  assert.equal(JSON.stringify(row).includes("renewed"), false);
  assert.equal(JSON.stringify(row).includes("test-not-a-real-proof"), false);
});
test("paid state prevents further approval and survives reads", () => {
  const e = make();
  saveExpense(e);
  paid(e.id, "MOCK-TEST", "executor");
  assert.equal(getExpense(e.id).status, "PAID");
  assert.throws(() =>
    saveApproval(e.id, "a", "finance-approver", proof("finance-approver")),
  );
  assert.ok(
    events().some((x) => x.expense === e.id && x.action === "MOCK_PAYMENT"),
  );
});
