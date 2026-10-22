# Live acceptance checklist

Record actual outcomes; do not check boxes based on unit tests. Use synthetic data only. Video should show the **live desk** and **native governed console**, not the rehearsal.

## Environment

- [ ] Real adapter exported with nonempty Tide keys, vendorId and the app's origin authorization; `npm run preflight` passes.
- [ ] Four separate user sessions; three independent linked realm administrators; current governance CR threshold at least 2.
- [ ] Five app realm roles assigned correctly and committed. No runtime master-admin credentials.
- [ ] `npm run check` passes. App + independent mock rail running.

## Business flow

- [ ] M1 submits 75,000,000 VND to DEMO-ACCOUNT-001 with synthetic invoice reference.
- [ ] M1 tries Execute immediately: rejected with 412, no mock receipt.
- [ ] M2 approves Finance; execute still rejected with 412.
- [ ] M3 approves Compliance; M1 executes before evidence expires; MOCK receipt appears.
- [ ] Clicking/retrying execution with the same valid evidence returns the same receipt, not a second payment. Inspect rail ledger count if needed; UI hides the button after payment.
- [ ] Expense details have no edit button/API; a corrected payment requires a new request and new approvals.
- [ ] M4 sees activity and cannot create, approve or execute.
- [ ] Unauthenticated API calls fail 401. A role from an unrelated client must not count as a realm app role.

## The decisive TideCloak governance test

- [ ] In the **application realm console**, Admin A proposes granting themselves `finance-approver` (or another test account a reviewer role).
- [ ] The grant creates a pending CR. Note request ID and actual threshold. Do not use master-realm credentials for this test.
- [ ] Admin A signs once in the enclave. CR remains pending/uncommitted under threshold; grant does not appear in a newly issued user's effective token.
- [ ] Login/refresh the target's app session: attempting the newly requested action is still forbidden (or verify new token lacks the role when self-approval would independently block).
- [ ] Admin B signs with their own linked identity. CR commits only when quorum and dependencies are satisfied.
- [ ] Fresh target login reflects the committed role. The application still disallows requester self-approval and filling both lanes with one subject.
- [ ] Revoke the temporary role through the same governance workflow. Observe existing tokens' bounded lifetime, then confirm future tokens lack the role.

If one admin can commit this grant, the central submission claim has not been demonstrated. Fix realm governance before recording.

## Adversarial checks

- [ ] A requester with a reviewer role still cannot self-approve.
- [ ] One reviewer holding both roles cannot fill both lanes on the same expense.
- [ ] Changing only app status/approval labels cannot create a valid pair of cryptographic proofs at the rail. Automated tests exercise this without damaging live records.
- [ ] Changing amount/account/payee/expense ID invalidates evidence; covered in signed-fixture tests.
- [ ] Waiting for token/proof expiry makes execution fail; Renew with two independent sessions restores eligibility.
- [ ] Logout/restart does not erase application or rail ledgers; runtime databases remain outside git.

## Submission

- [ ] Public GitHub repository; overview at top of README under 300 words and all five prompts present.
- [ ] Two-minute real integration demo added at `demo/demo.mp4`, linked from README; no password, invite URL or token in recording.
- [ ] Write the actual realm acceptance date/result in `docs/VALIDATION.md`; do not describe unperformed checks as passed.
- [ ] Check the repo and video link in a logged-out browser, then submit repository URL using the organiser's form.
