import { createServer } from "node:http";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { verifyPayment } from "../src/lib/desk/rail-verify";
import { digest, DeskError } from "../src/lib/desk/domain";
mkdirSync("data", { recursive: true });
const db = new DatabaseSync(process.env.RAIL_DB ?? "data/rail.sqlite");
db.exec(
  "PRAGMA journal_mode=WAL;CREATE TABLE IF NOT EXISTS payments(expense TEXT PRIMARY KEY,digest TEXT UNIQUE NOT NULL,receipt TEXT NOT NULL,at TEXT NOT NULL);",
);
const origin = process.env.APP_ORIGIN ?? "http://localhost:3000";
const port = Number(process.env.RAIL_PORT ?? 4100);
createServer(async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  const send = (s: number, v: unknown) => {
    res.writeHead(s);
    res.end(JSON.stringify(v));
  };
  if (req.url === "/health" && req.method === "GET")
    return send(200, { service: "independent-mock-rail", realMoney: false });
  if (req.url !== "/payments" || req.method !== "POST")
    return send(404, { error: "Not found" });
  try {
    let body = "";
    for await (const chunk of req) {
      body += chunk;
      if (body.length > 100000) throw new DeskError(413, "Payload too large");
    }
    const { expense, receipts } = JSON.parse(body);
    const authorizers = await verifyPayment(expense, receipts, origin);
    const hash = digest(expense);
    const existing = db
      .prepare("SELECT digest,receipt FROM payments WHERE expense=?")
      .get(expense.id);
    if (existing) {
      if (existing.digest !== hash)
        throw new DeskError(409, "Expense ID reused with different payment");
      return send(200, {
        receipt: existing.receipt,
        idempotent: true,
        realMoney: false,
      });
    }
    const receipt = `MOCK-${hash.slice(0, 24)}`;
    db.prepare("INSERT INTO payments VALUES(?,?,?,?)").run(
      expense.id,
      hash,
      receipt,
      new Date().toISOString(),
    );
    return send(201, { receipt, authorizers, realMoney: false });
  } catch (e) {
    send(e instanceof DeskError ? e.status : 412, {
      error: e instanceof Error ? e.message : "Invalid payment",
    });
  }
}).listen(port, process.env.RAIL_HOST ?? "127.0.0.1", () =>
  console.log(
    `Independent MOCK rail at http://127.0.0.1:${port}; no real payments`,
  ),
);
