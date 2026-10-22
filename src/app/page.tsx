"use client";
import { useTideCloak } from "@tidecloak/nextjs";
import { configured } from "./providers";
import { Shell } from "@/components/Shell";
function Login() {
  const { authenticated, login, logout, isInitializing } = useTideCloak();
  return (
    <div className="actions">
      {authenticated ? (
        <>
          <a className="button" href="/dashboard">
            Open expense desk →
          </a>
          <button className="secondary" onClick={() => logout()}>
            Sign out
          </button>
        </>
      ) : (
        <button disabled={isInitializing} onClick={() => login()}>
          {isInitializing ? "Connecting…" : "Sign in with TideCloak →"}
        </button>
      )}
    </div>
  );
}
export default function Home() {
  return (
    <Shell>
      <section className="hero">
        <div className="eyebrow">AUTHORITY, SHARED BY DESIGN</div>
        <h1>
          Big decisions.
          <br />
          <span>No single gatekeeper.</span>
        </h1>
        <p>
          Approve high-value expenses together. Protect who gets to approve. A
          compromised administrator should never become the entire approval
          chain.
        </p>
        {configured ? (
          <Login />
        ) : (
          <div className="notice">
            <b>TideCloak setup required</b>
            <p>
              Run <code>npm run init</code>, link your administrators and
              configure roles. See <code>docs/SETUP_VI.md</code>. Restart the
              app after exporting the adapter.
            </p>
          </div>
        )}
        <a className="text-link" href="/lab">
          Try the clearly labelled interactive rehearsal →
        </a>
        <div className="principles">
          <article>
            <span>01 / IDENTITY</span>
            <h3>Know who approved</h3>
            <p>Tide-signed identities and DPoP-bound requests.</p>
          </article>
          <article>
            <span>02 / GOVERNANCE</span>
            <h3>Protect the approvers</h3>
            <p>
              IGA governs role grants. Three linked admins, two required
              approvals.
            </p>
          </article>
          <article>
            <span>03 / EXECUTION</span>
            <h3>Verify, independently</h3>
            <p>A separate mock rail checks both signed approval proofs.</p>
          </article>
        </div>
      </section>
    </Shell>
  );
}
