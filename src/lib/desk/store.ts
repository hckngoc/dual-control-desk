import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import {
  digest,
  demand,
  type Expense,
  type Receipt,
  type Lane,
} from "./domain";
let db: DatabaseSync;
export function database() {
  if (!db) {
    mkdirSync("data", { recursive: true });
    db = new DatabaseSync(
      process.env.DESK_DB ?? join(process.cwd(), "data/desk.sqlite"),
    );
    db.exec(`PRAGMA journal_mode=WAL;PRAGMA busy_timeout=5000;
CREATE TABLE IF NOT EXISTS expenses(id TEXT PRIMARY KEY,payload TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'PENDING',payment TEXT);
CREATE TABLE IF NOT EXISTS approvals(expense TEXT NOT NULL,lane TEXT NOT NULL,subject TEXT NOT NULL,token TEXT NOT NULL,proof TEXT NOT NULL,created TEXT NOT NULL,PRIMARY KEY(expense,lane),UNIQUE(expense,subject));
CREATE TABLE IF NOT EXISTS audit(seq INTEGER PRIMARY KEY AUTOINCREMENT,at TEXT NOT NULL,actor TEXT NOT NULL,action TEXT NOT NULL,expense TEXT,detail TEXT NOT NULL);`);
  }
  return db;
}
export function audit(
  actor: string,
  action: string,
  expense: string | null,
  detail: string,
) {
  database()
    .prepare(
      "INSERT INTO audit(at,actor,action,expense,detail) VALUES(?,?,?,?,?)",
    )
    .run(new Date().toISOString(), actor, action, expense, detail);
}
export function saveExpense(e: Expense) {
  database()
    .prepare("INSERT INTO expenses(id,payload) VALUES(?,?)")
    .run(e.id, JSON.stringify(e));
  audit(e.requester, "SUBMITTED", e.id, digest(e));
}
export function getExpense(id: string): {
  expense: Expense;
  status: string;
  payment: string | null;
} {
  const r = database().prepare("SELECT * FROM expenses WHERE id=?").get(id) as
    { payload: string; status: string; payment: string | null } | undefined;
  demand(r, 404, "Expense not found");
  return {
    expense: JSON.parse(r.payload),
    status: r.status,
    payment: r.payment,
  };
}
export function listExpenses() {
  return database()
    .prepare("SELECT * FROM expenses ORDER BY rowid DESC")
    .all()
    .map((r) => {
      const e = JSON.parse(String(r.payload)) as Expense;
      const approvals = database()
        .prepare("SELECT lane,subject,created FROM approvals WHERE expense=?")
        .all(e.id);
      return {
        ...e,
        digest: digest(e),
        status: r.status,
        payment: r.payment,
        approvals,
      };
    });
}
export function saveApproval(
  id: string,
  subject: string,
  lane: Lane,
  r: Receipt,
) {
  const d = database();
  d.exec("BEGIN IMMEDIATE");
  try {
    const e = getExpense(id);
    demand(e.status === "PENDING", 409, "Expense already paid");
    const a = d
      .prepare("SELECT lane,subject FROM approvals WHERE expense=?")
      .all(id);
    demand(
      !a.some((x) => x.subject === subject && x.lane !== lane),
      409,
      "One identity cannot fill both lanes",
    );
    d.prepare(
      "INSERT INTO approvals(expense,lane,subject,token,proof,created) VALUES(?,?,?,?,?,?) ON CONFLICT(expense,lane) DO UPDATE SET subject=excluded.subject,token=excluded.token,proof=excluded.proof,created=excluded.created",
    ).run(id, lane, subject, r.token, r.proof, new Date().toISOString());
    audit(subject, "APPROVED", id, lane);
    d.exec("COMMIT");
  } catch (e) {
    d.exec("ROLLBACK");
    throw e;
  }
}
export function receipts(id: string): Receipt[] {
  return database()
    .prepare("SELECT lane,token,proof FROM approvals WHERE expense=?")
    .all(id) as unknown as Receipt[];
}
export function paid(id: string, payment: string, actor: string) {
  const d = database();
  d.exec("BEGIN IMMEDIATE");
  try {
    d.prepare("UPDATE expenses SET status='PAID',payment=? WHERE id=?").run(
      payment,
      id,
    );
    audit(actor, "MOCK_PAYMENT", id, payment);
    d.exec("COMMIT");
  } catch (e) {
    d.exec("ROLLBACK");
    throw e;
  }
}
export function events() {
  return database()
    .prepare("SELECT * FROM audit ORDER BY seq DESC LIMIT 200")
    .all();
}
