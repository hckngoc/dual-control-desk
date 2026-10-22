import { spawn } from "node:child_process";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const port = Number(process.env.SMOKE_PORT ?? 3317);
const app = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    String(port),
  ],
  { stdio: ["ignore", "pipe", "pipe"] },
);
let logs = "";
app.stdout.on("data", (b) => (logs += b));
app.stderr.on("data", (b) => (logs += b));
const origin = `http://127.0.0.1:${port}`;
try {
  let ready = false;
  for (let i = 0; i < 40; i++) {
    try {
      if ((await fetch(origin + "/api/health")).ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  assert.ok(ready, logs);
  for (const path of ["/", "/lab", "/api/health"]) {
    const r = await fetch(origin + path);
    assert.equal(r.status, 200);
    console.log(`PASS public ${path}`);
  }
  for (const path of ["/api/me", "/api/expenses", "/api/audit"]) {
    const r = await fetch(origin + path);
    assert.equal(r.status, 401);
    console.log(`PASS anonymous rejection ${path}`);
  }
  const forged = await fetch(origin + "/api/expenses", {
    headers: { authorization: "Bearer fabricated" },
  });
  assert.equal(forged.status, 401);
  console.log("PASS forged token rejected");
  const relay = await fetch(
    origin + "/tide_dpop/iss/test/aud/test/tide_dpop_auth.html",
  );
  assert.equal(relay.status, 200);
  assert.equal(relay.headers.get("allow-csp-from"), "*");
  assert.ok(
    relay.headers
      .get("content-security-policy")
      ?.includes("script-src 'unsafe-inline'"),
  );
  assert.equal(
    await relay.text(),
    readFileSync("public/tide_dpop_auth.html", "utf8"),
  );
  console.log("PASS served DPoP relay byte exact and headers present");
} finally {
  app.kill("SIGTERM");
}
