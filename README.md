[![Built with TideCloak](https://tide.org/badges/built-with-tidecloak.svg)](https://tide.org/tidecloak?utm_source=github&utm_medium=readme&utm_campaign=unlocked)

## Project overview

Dual-Control Expense Desk lets teams authorise high-value expenses without allowing one administrator to manufacture the approvers.

Built with [TideCloak](https://tide.org/tidecloak?utm_source=github&utm_medium=readme&utm_campaign=unlocked).

### 1. Vision & originality

Shared finance for community projects: two independent reviewers approve an immutable expense, while a separate mock payment verifier checks their identity-bound evidence before execution.

### 2. Trust constraint insight

Ordinary dual approval collapses if one administrator can promote themselves into both reviewer roles. TideCloak IGA governs those role grants. With three linked administrators, one signature cannot meet the governance threshold.

### 3. Value & impact

A community clinic can buy 75 million VND of equipment with finance and compliance oversight, without entrusting one volunteer, administrator or AI assistant with unilateral approval authority.

### 4. Why TideCloak matters

TideCloak supplies signed identities, DPoP-bound authentication and quorum-governed approver membership. The application never uses master-admin credentials at runtime. A separate mock rail revalidates both reviewers' signed request proofs, distinct subjects, required roles and the expense digest; changing a database status is insufficient.

### 5. Prototype & storytelling

Submit a synthetic expense; show early execution blocked; collect finance and compliance approvals; execute a mock payment. Then attempt a role grant in the governed TideCloak console: one administrator leaves it pending; quorum commits it. The rehearsal page is explicitly a simulation. No real payment rail or production certification is claimed.

## Setup

**Start here:** [Hướng dẫn tiếng Việt](docs/SETUP_VI.md). Node.js **24 LTS recommended** (minimum 22.13), npm, Docker Desktop, curl and jq.

```bash
npm ci
npm run dev
```

Open **http://localhost:3000/lab** for the labelled interactive rehearsal. The live desk deliberately requires a real TideCloak adapter; there is no mock authentication fallback.

For the live integration, follow the guide to bootstrap a new realm **or reuse an existing realm**, link three administrators, create app roles and export the adapter. Do not run initialisation over your existing setup. Linking a Tide MCP plugin in ChatGPT alone does not configure an application's realm.

```bash
# After real realm configuration and adapter export:
npm run preflight
npm run rail     # terminal 1
npm run dev      # terminal 2; open http://localhost:3000
npm run check    # terminal 3: typecheck, tests, production build
npm run smoke    # production HTTP checks after build
```

Restart the app and rail after replacing the adapter. Always use `localhost`, consistently, for the browser and the configured origin. Production alternative: `npm run build && npm start`. Optional local containers: `docker compose up --build` **after** exporting the real adapter; rebuild whenever it changes.

## Demo Video

Watch our **Dual-Control Expense Desk** demo, built for the Tide Unlocked Hackathon 2026.

[**▶ Watch Demo Video (MP4)**](demo/demo.mp4)

The video demonstrates:
- Role-based access control and unauthorized action denial.
- Independent Finance and Compliance approvals.
- Protected mock payment execution.
- Two-administrator governance simulation.

**Integration Mode:** TideCloak Plan C — Simulated Security Controls.

[Demo Script & Narration](docs/DEMO_SCRIPT_VI.md)

## What is included

- Responsive Next.js expense UI, immutable synthetic requests, finance/compliance approval lanes and executor action.
- Official TideCloak SDK provider, redirect flow and byte-exact DPoP relay; server JWT/DPoP verification, pinned public keys and persistent replay protection.
- Separate mock payment verifier with its own SQLite ledger, operation-bound approval evidence and idempotency.
- Native TideCloak console for real IGA role governance, rather than a simulated governance API.
- Clearly labelled browser-only rehearsal, audit view, automated adversarial checks and GitHub Actions.

## Architecture and evidence

[Security boundaries](docs/SECURITY.md) · [API contract](docs/API.md) · [Manual acceptance](docs/ACCEPTANCE.md) · [Validation status](docs/VALIDATION.md) · [Team and GitHub](docs/TEAM_GITHUB_VI.md)

**Honest boundary:** application expense policy is code in the separate mock rail, not a deployed custom Tide signing contract. DPoP establishes a signed request and key possession, not a human-readable consent ceremony. Tide IGA protects role membership; live governance still must be configured and demonstrated. Existing tokens remain usable until expiry or the verifier's five-minute maximum age. Local root access controlling every process and trust file is outside the prototype's independent-service threat model. See the security document before making claims.

## Repository map

```text
src/app/                 Pages and protected HTTP routes
src/lib/auth/            Official Tide verification + durable replay store
src/lib/desk/            Expense rules, persistence, independent verification
rail/server.ts           Separate mock execution service
scripts/                 Safe bootstrap, export, preflight, publish
tests/                   Domain and adversarial cryptographic tests
docs/                    Setup, acceptance, architecture and demo guide
demo/                    Add the team's video here
```

Original application code is MIT licensed. See [LICENSE](LICENSE) and [NOTICE.md](NOTICE.md) for attribution to Tide's supplied integration templates.

## Plan C offline simulation (Tide service unavailable)

Visit `/lab` after `npm ci && npm run dev`. This is a **browser-only** demonstration of the TideCloak trust model, not live authentication, cryptographic signing, server-side authorization, or deployed IGA. Sign in as Minh to approve Finance, An to approve Compliance, and Hoa to execute the mock payment. Attempt each action with a wrong role first to demonstrate denial. Switch to Admin A and Admin B to demonstrate two-person role-grant governance. The real TideCloak integration is retained separately in `/dashboard` and API routes, and must be validated against a working realm before any claim of live Tide protection.
