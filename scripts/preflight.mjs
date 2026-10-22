import { readFileSync, existsSync } from "node:fs";
const config = existsSync("data/tidecloak.json")
  ? JSON.parse(readFileSync("data/tidecloak.json", "utf8"))
  : null;
const checks = [
  [
    "Node >=22.13",
    Number(process.versions.node.split(".")[0]) > 22 ||
      (Number(process.versions.node.split(".")[0]) === 22 &&
        Number(process.versions.node.split(".")[1]) >= 13),
  ],
  ["Adapter exported from real realm", config && !config._unconfigured],
  ["Embedded Tide public keys", config?.jwk?.keys?.length > 0],
  ["Licensed vendor identifier", Boolean(config?.vendorId)],
  [
    "Client origin authorization",
    Boolean(
      config &&
      Object.keys(config).some((k) => k.startsWith("client-origin-auth-")),
    ),
  ],
];
for (const [label, ok] of checks)
  console.log(`${ok ? "PASS" : "FAIL"} ${label}`);
console.log(
  "Manual acceptance still required: 3 linked realm admins, live token roles, role grant pending after one signature and committed after two.",
);
if (checks.some(([, ok]) => !ok)) process.exitCode = 1;
