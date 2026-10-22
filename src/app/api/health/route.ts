export const GET = async () =>
  Response.json({
    service: "dual-control-desk",
    realMoney: false,
    auth: "TideCloak JWT + DPoP",
    rail: "Independent mock verifier",
    time: new Date().toISOString(),
  });
