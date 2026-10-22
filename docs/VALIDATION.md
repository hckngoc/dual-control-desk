# Validation record — 2026-10-22

## Completed on the supplied source

| Check | Result |
|---|---|
| TypeScript strict type check | PASS |
| Production Next.js webpack build | PASS |
| 18 automated domain, cryptographic and SQLite tests | PASS |
| Production HTTP smoke checks | PASS: `/`, `/lab`, `/api/health` return 200; anonymous `/api/me`, `/api/expenses`, `/api/audit` return 401; forged Bearer token returns 401 |
| Served DPoP relay | PASS: byte-exact response, expected CSP and `Allow-CSP-From` header |
| Shell script syntax | PASS: init, adapter export, invite, GitHub publishing |
| Official Tide doctor static wiring | DPoP provider/relay/rewrite/server verification checks pass; real adapter readiness remains incomplete |

Tests use ephemeral synthetic issuer keys only inside the test process. Passing them verifies implementation behavior, not that a real Tide realm has been activated.

## Not yet performed / requires the team's deployment

- Real licensed TideCloak realm activation and actual user login.
- Three independently linked realm administrators and actual IGA role-grant quorum ceremony.
- Live four-user business flow, current roles, token renewal/revocation and real enclave approvals.
- Docker image/Compose run on the team's Docker engine.
- Two-minute demo video and public GitHub publication.

The included adapter generated on first build is explicitly unconfigured (`_unconfigured: true`, empty key set). It cannot authenticate users. Tide doctor correctly reports missing live vendor/origin authorization; do not insert invented values to turn these checks green. Only an export from a configured realm resolves them.

No production certification or blanket security guarantee is claimed. Before submission, execute `docs/ACCEPTANCE.md` against the real deployment and append date, realm identifier (no secrets), observed threshold, test operator and actual outcome below.

## Team live validation

Pending.
