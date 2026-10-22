"use client";
import { useTideCloak } from "@tidecloak/nextjs";
import { configured } from "../providers";
import { useEffect } from "react";
function Gate({ children }: { children: React.ReactNode }) {
  const { authenticated, isInitializing, login } = useTideCloak();
  useEffect(() => {
    if (!isInitializing && !authenticated) login();
  }, [authenticated, isInitializing, login]);
  return authenticated ? (
    <>{children}</>
  ) : (
    <div className="loading">Checking TideCloak authentication…</div>
  );
}
export default function Layout({ children }: { children: React.ReactNode }) {
  return configured ? (
    <Gate>{children}</Gate>
  ) : (
    <div className="loading">
      <h1>Connect TideCloak first</h1>
      <p>Follow docs/SETUP_VI.md, then restart the app.</p>
      <a href="/">← Back</a>
    </div>
  );
}
