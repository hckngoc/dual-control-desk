#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
command -v gh >/dev/null || { echo 'Install GitHub CLI: https://cli.github.com/ then run gh auth login'; exit 1; }
gh auth status
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then git init -b main; fi
npm run check
git add .
if ! git diff --cached --quiet; then git commit -m "Build Dual-Control Expense Desk with TideCloak and independent mock rail"; fi
gh repo create dual-control-desk --public --source . --remote origin --push
