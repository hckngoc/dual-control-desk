import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import type { JtiStore } from "./verifyDpop";
let db: DatabaseSync;
// Persistent, shared by the processes on this local host. This prototype is not serverless.
export const replayStore: JtiStore = {
  async claim(jti, expiresAtMs) {
    if (!db) {
      mkdirSync("data", { recursive: true });
      db = new DatabaseSync(process.env.DPOP_DB ?? "data/dpop.sqlite");
      db.exec(
        "PRAGMA busy_timeout=5000;CREATE TABLE IF NOT EXISTS jtis(id TEXT PRIMARY KEY,expires INTEGER NOT NULL)",
      );
    }
    db.prepare("DELETE FROM jtis WHERE expires < ?").run(Date.now());
    return (
      db.prepare("INSERT OR IGNORE INTO jtis VALUES(?,?)").run(jti, expiresAtMs)
        .changes === 1
    );
  },
};
