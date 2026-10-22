"use client";
import { useTideCloak } from "@tidecloak/nextjs";
import { useCallback, useEffect, useState } from "react";
import { Shell } from "@/components/Shell";
type Row = {
  id: string;
  title: string;
  payee: string;
  account: string;
  amount: number;
  currency: string;
  evidence: string;
  requester: string;
  createdAt: string;
  digest: string;
  status: string;
  payment: string | null;
  approvals: { lane: string; subject: string; created: string }[];
};
type Who = { sub: string; name: string; roles: string[] };
type Event = {
  seq: number;
  at: string;
  actor: string;
  action: string;
  detail: string;
};
const money = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    n,
  );
export default function Dashboard() {
  const { secureFetch, logout } = useTideCloak();
  const [who, setWho] = useState<Who | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const api = useCallback(
    async (path: string, body?: unknown) => {
      const r = await secureFetch(
        new URL(path, window.location.origin).href,
        body === undefined
          ? {}
          : {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            },
      );
      const d = await r.json();
      if (!r.ok)
        throw new Error(`${r.status} · ${d.error ?? "Request failed"}`);
      return d;
    },
    [secureFetch],
  );
  const refresh = useCallback(async () => {
    try {
      const m = await api("/api/me");
      setWho(m.identity);
      const d = await api("/api/expenses");
      setRows(d.expenses);
      if (
        m.identity.roles.some((r: string) =>
          [
            "auditor",
            "finance-approver",
            "compliance-approver",
            "payment-executor",
          ].includes(r),
        )
      ) {
        const a = await api("/api/audit");
        setEvents(a.events);
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }, [api]);
  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 15000);
    return () => clearInterval(t);
  }, [refresh]);
  async function act(e: Row, action: string) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const d = await api(`/api/expenses/${e.id}/${e.digest}/${action}`, {});
      setNotice(
        action === "execute"
          ? `Mock payment accepted · ${d.receipt}`
          : "Signed approval recorded. Complete payment within 5 minutes and before your access token expires.",
      );
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function submit(form: FormData) {
    setBusy(true);
    setError("");
    try {
      await api("/api/expenses", {
        title: form.get("title"),
        payee: form.get("payee"),
        account: form.get("account"),
        amount: Number(form.get("amount")),
        evidence: form.get("evidence"),
      });
      setShowForm(false);
      await refresh();
      setNotice(
        "Expense submitted. Finance and compliance must approve independently.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const e = rows.find((r) => r.id === selected) ?? rows[0];
  const has = (r: string) => who?.roles.includes(r);
  return (
    <Shell>
      <section className="content">
        <div className="page-heading">
          <div>
            <div className="eyebrow">CONTROL CENTER</div>
            <h1>
              Expense desk<span className="small-dot">.</span>
            </h1>
            <p>Independent approvals. Verifiable execution.</p>
          </div>
          <div className="actions">
            <button className="secondary" onClick={() => logout()}>
              Sign out
            </button>
            {has("requester") && (
              <button onClick={() => setShowForm(!showForm)}>
                ＋ New expense
              </button>
            )}
          </div>
        </div>
        <div className="identity">
          <span className="avatar">
            {who?.name.slice(0, 1).toUpperCase() ?? "?"}
          </span>
          <div>
            <b>{who?.name ?? "Verifying identity…"}</b>
            <p>
              {who?.roles
                .filter((r) => !r.startsWith("_") && !r.startsWith("default-"))
                .join(" · ") || "No application roles assigned"}
            </p>
          </div>
          <span className="pill green">JWT + DPoP VERIFIED BY API</span>
        </div>
        {error && (
          <div className="notice error" role="alert">
            {error}
            <p>
              Expired approval? Both reviewers can click their approval again
              with fresh sessions. Connection refused? Start npm run rail.
            </p>
          </div>
        )}
        {notice && (
          <div className="notice" role="status">
            {notice}
          </div>
        )}
        <div className="stats">
          <article>
            <span>AWAITING AUTHORITY</span>
            <strong>
              {rows
                .filter((r) => r.status === "PENDING")
                .length.toString()
                .padStart(2, "0")}
            </strong>
          </article>
          <article>
            <span>MOCK PAYMENTS</span>
            <strong>
              {rows
                .filter((r) => r.status === "PAID")
                .length.toString()
                .padStart(2, "0")}
            </strong>
          </article>
          <article>
            <span>HIGH-VALUE MINIMUM</span>
            <strong>
              10M <small>VND</small>
            </strong>
          </article>
        </div>
        {showForm && (
          <form className="panel form" action={submit}>
            <h2>New high-value expense</h2>
            <p>
              Synthetic data only. Submitted details are immutable; create a new
              request to change them.
            </p>
            <div className="form-grid">
              <label>
                Expense title
                <input
                  name="title"
                  required
                  minLength={3}
                  maxLength={120}
                  defaultValue="Community clinic equipment"
                />
              </label>
              <label>
                Payee
                <input
                  name="payee"
                  required
                  minLength={3}
                  maxLength={100}
                  defaultValue="Synthetic Medical Supplies"
                />
              </label>
              <label>
                Mock account
                <input
                  name="account"
                  required
                  minLength={3}
                  maxLength={80}
                  defaultValue="DEMO-ACCOUNT-001"
                />
              </label>
              <label>
                Amount (VND)
                <input
                  name="amount"
                  type="number"
                  required
                  min={10000000}
                  max={100000000000}
                  step={1}
                  defaultValue={75000000}
                />
              </label>
              <label className="wide">
                Evidence reference
                <input
                  name="evidence"
                  required
                  minLength={3}
                  maxLength={180}
                  defaultValue="SYNTHETIC-INVOICE-2026-001"
                />
              </label>
            </div>
            <button disabled={busy}>Submit request →</button>
          </form>
        )}
        <div className="desk-grid">
          <section className="panel">
            <div className="panel-heading">
              <h2>
                Requests <span>{rows.length}</span>
              </h2>
              <button className="link-button" onClick={refresh}>
                ↻ Refresh
              </button>
            </div>
            {rows.length === 0 ? (
              <div className="empty">
                <span>◇</span>
                <h3>No expenses yet</h3>
                <p>A requester can submit the first synthetic expense.</p>
              </div>
            ) : (
              rows.map((r) => (
                <button
                  className={
                    "expense-row " + (e?.id === r.id ? "selected" : "")
                  }
                  key={r.id}
                  onClick={() => setSelected(r.id)}
                >
                  <div className="expense-icon">↗</div>
                  <div>
                    <b>{r.title}</b>
                    <small>{r.payee}</small>
                    <span
                      className={
                        "pill " + (r.status === "PAID" ? "green" : "amber")
                      }
                    >
                      {r.status === "PAID"
                        ? "MOCK PAID"
                        : `${r.approvals.length}/2 APPROVALS`}
                    </span>
                  </div>
                  <strong>{money(r.amount)}</strong>
                </button>
              ))
            )}
          </section>
          <section className="panel detail">
            {e ? (
              <>
                <div className="panel-heading">
                  <h2>Approval pathway</h2>
                  <span className="pill">IMMUTABLE REQUEST</span>
                </div>
                <h2>{e.title}</h2>
                <div className="amount">{money(e.amount)}</div>
                <dl>
                  <dt>Payee</dt>
                  <dd>{e.payee}</dd>
                  <dt>Mock account</dt>
                  <dd>{e.account}</dd>
                  <dt>Evidence</dt>
                  <dd>{e.evidence}</dd>
                  <dt>Digest</dt>
                  <dd className="mono" title={e.digest}>
                    {e.digest.slice(0, 24)}…
                  </dd>
                </dl>
                {["finance-approver", "compliance-approver"].map((lane, i) => {
                  const a = e.approvals.find((a) => a.lane === lane);
                  return (
                    <div className="approval-step" key={lane}>
                      <span className={"step " + (a ? "done" : "")}>
                        {a ? "✓" : i + 1}
                      </span>
                      <div>
                        <b>
                          {i === 0 ? "Finance review" : "Compliance review"}
                        </b>
                        <p>
                          {a
                            ? `${a.subject.slice(0, 14)}… · recorded`
                            : "Waiting for an independent identity"}
                        </p>
                      </div>
                      {has(lane) && e.status === "PENDING" && (
                        <button
                          className="secondary"
                          disabled={busy || who?.sub === e.requester}
                          onClick={() => act(e, lane)}
                        >
                          {a ? "Renew" : "Approve"}
                        </button>
                      )}
                    </div>
                  );
                })}
                <div className="rail-box">
                  <b>◇ Independent mock rail</b>
                  <p>
                    Rechecks Tide JWTs, role scopes, DPoP signatures, distinct
                    identities and this expense digest.
                  </p>
                  {e.status === "PAID" ? (
                    <code>{e.payment}</code>
                  ) : has("payment-executor") ? (
                    <button disabled={busy} onClick={() => act(e, "execute")}>
                      {busy ? "Verifying…" : "Execute mock payment →"}
                    </button>
                  ) : (
                    <span className="pill">PAYMENT EXECUTOR REQUIRED</span>
                  )}
                </div>
                <p className="fine-print">
                  Approval proofs last at most 5 minutes and cannot outlive
                  their access token. Recorded checks do not imply a current
                  guarantee.
                </p>
              </>
            ) : (
              <div className="empty">
                Select an expense to inspect its approval pathway.
              </div>
            )}
          </section>
        </div>
        <section className="panel governance">
          <div>
            <div className="eyebrow">THE TRUST BOTTLENECK</div>
            <h2>Who can become an approver?</h2>
            <p>
              Role changes belong to TideCloak IGA. Use the governed realm
              console with three linked administrators; verify a role grant
              stays pending after one approval and commits after two.
            </p>
          </div>
          <a
            className="button secondary"
            href="http://localhost:8080/admin/dual-control-desk/console/"
            target="_blank"
            rel="noreferrer"
          >
            Open local governance console ↗
          </a>
        </section>
        {events.length > 0 && (
          <section className="panel">
            <div className="panel-heading">
              <h2>Activity log</h2>
              <span className="pill">APP AUDIT · NOT TAMPER-PROOF</span>
            </div>
            <div className="audit">
              {events.slice(0, 12).map((x) => (
                <div key={x.seq}>
                  <time>{new Date(x.at).toLocaleTimeString()}</time>
                  <b>{x.action}</b>
                  <span>{x.detail}</span>
                </div>
              ))}
            </div>
          </section>
        )}
        <footer>
          SYNTHETIC DATA · NO BANK CONNECTION · TIDECLOAK IGA GOVERNS APPROVER
          MEMBERSHIP
        </footer>
      </section>
    </Shell>
  );
}
