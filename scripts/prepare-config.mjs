import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
mkdirSync("data", { recursive: true });
if (!existsSync("data/tidecloak.json"))
  writeFileSync(
    "data/tidecloak.json",
    JSON.stringify(
      {
        realm: "dual-control-desk",
        "auth-server-url": "http://localhost:8080",
        resource: "dual-control-desk-client",
        "public-client": true,
        "ssl-required": "external",
        "confidential-port": 0,
        jwk: { keys: [] },
        _unconfigured: true,
      },
      null,
      2,
    ),
  );
const config = JSON.parse(readFileSync("data/tidecloak.json", "utf8"));
if (
  config["public-client"] !== true ||
  config.credentials ||
  config.jwk?.keys?.some((k) => k.d || k.k)
)
  throw new Error(
    "Only a public-client adapter with public verification keys may be bundled. Never use client credentials or private keys.",
  );
