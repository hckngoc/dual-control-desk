# Contributing

Read docs/TEAM_GITHUB_VI.md and docs/API.md before changing the shared contract. Work on branches and open reviewed pull requests.

Run `npm ci`, `npm run check`, then `npm run smoke`. Use `npm run format` to format application code. Preserve `public/tide_dpop_auth.html` byte-exact; do not run an HTML formatter on it.

Do not commit `.env`, `.env.bootstrap`, real adapter exports, databases, tokens or invite links. Auth changes also require real login and IGA acceptance; tests alone do not validate realm configuration.
