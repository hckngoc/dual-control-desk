"use client";
import { useState } from "react";
import { Shell } from "@/components/Shell";

type User = { id: string; name: string; roles: string[] };
const initialUsers: User[] = [
  { id: "requester", name: "Linh — Requester", roles: ["requester"] },
  { id: "finance", name: "Minh — Finance", roles: ["finance-approver"] },
  { id: "compliance", name: "An — Compliance", roles: ["compliance-approver"] },
  { id: "executor", name: "Hoa — Executor", roles: ["executor"] },
  { id: "admin-a", name: "Admin A", roles: ["governance-admin"] },
  { id: "admin-b", name: "Admin B", roles: ["governance-admin"] },
  { id: "admin-c", name: "Admin C", roles: ["governance-admin"] },
];
type Approval = { lane: string; subject: string };
export default function Lab() {
  const [users, setUsers] = useState(initialUsers);
  const [actor, setActor] = useState("");
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [admins, setAdmins] = useState<string[]>([]);
  const [paid, setPaid] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [message, setMessage] = useState("Sign in as a demo identity to begin.");
  const current = users.find((u) => u.id === actor);
  const has = (r: string) => Boolean(current?.roles.includes(r));
  function say(text: string) {
    const entry = `${new Date().toLocaleTimeString()} | ${current?.name ?? "Anonymous"} | ${text}`;
    setMessage(text);
    setLog((old) => [entry, ...old]);
  }
  function approve(lane: string) {
    if (!current) return say("DENIED (401): sign in first.");
    if (!has(lane)) return say(`DENIED (403): ${lane} role required.`);
    if (current.id === "requester") return say("DENIED (403): requester cannot self-approve.");
    if (approvals.some((a) => a.subject === current.id)) return say("DENIED (403): one identity cannot approve both lanes.");
    if (approvals.some((a) => a.lane === lane)) return say("DENIED (409): lane already approved.");
    if (paid) return say("DENIED (409): payment already executed.");
    setApprovals((old) => [...old, { lane, subject: current.id }]);
    say(`APPROVED: ${lane}, identity ${current.id}.`);
  }
  function pay() {
    if (!current) return say("DENIED (401): sign in first.");
    if (!has("executor")) return say("DENIED (403): executor role required.");
    if (paid) return say("DENIED (409): duplicate execution blocked.");
    if (approvals.length !== 2 || new Set(approvals.map((a) => a.subject)).size !== 2 || new Set(approvals.map((a) => a.lane)).size !== 2)
      return say("DENIED (412): independent Finance and Compliance approvals required.");
    setPaid(true);
    say("ACCEPTED: mock payment executed. No real funds transferred.");
  }
  function govern() {
    if (!current) return say("DENIED (401): sign in first.");
    if (!has("governance-admin")) return say("DENIED (403): governance-admin role required.");
    if (admins.includes(current.id)) return say("DENIED (409): administrator already voted.");
    const next = [...admins, current.id];
    setAdmins(next);
    if (next.length >= 2) {
      setUsers((old) => old.map((u) => u.id === "requester" ? { ...u, roles: [...u.roles, "finance-approver"] } : u));
      say("SIMULATED COMMIT: two distinct admins approved granting Finance to Linh. Existing requester conflict still blocks self-approval.");
    } else say("PENDING: one administrator cannot grant a role.");
  }
  function reset() {
    setUsers(initialUsers); setActor(""); setApprovals([]); setAdmins([]); setPaid(false); setLog([]);
    setMessage("Simulation reset. Sign in to begin.");
  }
  return (
    <Shell lab>
      <section className="content">
        <div className="page-heading"><div><div className="eyebrow">PLAN C / TIDECLOAK SECURITY SIMULATION</div><h1>Dual-Control Expense Desk</h1><p>Identity-bound approvals, role enforcement and two-admin governance.</p></div><button className="secondary" onClick={reset}>Reset simulation</button></div>
        <div className="notice amber"><b>SIMULATION — NOT LIVE TIDECLOAK</b><p>All identities, role grants, access checks and approvals are simulated in browser memory. No cryptographic proof, actual TideCloak login, independent backend enforcement or real payment is performed. The live implementation remains separate.</p></div>
        <section className="panel detail"><div className="eyebrow">00 / SIMULATED SIGN-IN</div><h2>Choose a demo identity</h2><p>Switch identities to demonstrate independent decision makers. This is not a password-based login.</p><select aria-label="Demo identity" value={actor} onChange={(e) => { setActor(e.target.value); setMessage(`Signed in as ${users.find((u) => u.id === e.target.value)?.name ?? "anonymous"} (simulation).`); }}><option value="">Signed out</option>{users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select><p>Active roles: {current?.roles.join(", ") ?? "none"}</p></section>
        <div className="stats"><article><span>DEMO EXPENSE</span><strong>75M <small>VND</small></strong></article><article><span>INDEPENDENT APPROVALS</span><strong>{approvals.length}/2</strong></article><article><span>GOVERNANCE VOTES</span><strong>{admins.length}/2</strong></article></div>
        <div className="desk-grid">
          <section className="panel detail"><div className="eyebrow">01 / EXPENSE POLICY</div><h2>Approve the equipment purchase</h2><p>Requester: Linh · Synthetic Medical Supplies · 75,000,000 VND</p>
            {(["finance-approver", "compliance-approver"] as const).map((lane) => <div className="approval-step" key={lane}><span className={"step " + (approvals.some((a) => a.lane === lane) ? "done" : "")}>{approvals.some((a) => a.lane === lane) ? "✓" : "○"}</span><div><b>{lane}</b><p>{approvals.find((a) => a.lane === lane)?.subject ?? "Awaiting independent identity"}</p></div><button className="secondary" onClick={() => approve(lane)}>Attempt approval</button></div>)}
            <div className="rail-box"><button onClick={pay}>{paid ? "Attempt duplicate payment" : "Attempt mock payment"}</button><p>{paid ? "Mock payment completed" : "Payment blocked until both independent approvals and executor authorization"}</p></div>
          </section>
          <section className="panel detail"><div className="eyebrow">02 / GOVERNANCE POLICY</div><h2>No unilateral role grants</h2><p>Proposed change: grant Finance role to Linh. Two distinct governance administrators must authorize it.</p><button onClick={govern}>Vote on role grant as current identity</button><p>Votes: {admins.join(", ") || "none"}</p><div className="rail-box"><b>{admins.length >= 2 ? "Grant committed (simulated)" : "Grant pending"}</b><p>A single admin cannot change role membership. A newly granted role does not bypass the no-self-approval rule.</p></div></section>
        </div>
        <div className="notice" role="status">{message}</div>
        <section className="panel"><div className="panel-heading"><h2>Simulated audit trail</h2><a href="/dashboard">Live TideCloak desk →</a></div><div className="audit">{log.length ? log.map((entry, i) => <div key={i}><span>{entry}</span></div>) : <p>No events yet.</p>}</div></section>
      </section>
    </Shell>
  );
}
