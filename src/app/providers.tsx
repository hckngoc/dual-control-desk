"use client";
import { TideCloakProvider } from "@tidecloak/nextjs";
import tcConfig from "../../data/tidecloak.json";
export const configured = !(tcConfig as { _unconfigured?: boolean })
  ._unconfigured;
// Keep the official provider and all four DPoP pieces intact. Unconfigured is a setup screen,
// not an alternative authentication mode. API verification always requires real Tide keys.
export function Providers({ children }: { children: React.ReactNode }) {
  return configured ? (
    <TideCloakProvider
      config={{ ...tcConfig, useDPoP: { mode: "strict", alg: "ES256" } }}
    >
      {children}
    </TideCloakProvider>
  ) : (
    <>{children}</>
  );
}
