import { DeskError } from "./domain";
export async function result(fn: () => Promise<Response>) {
  try {
    return await fn();
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Unexpected error" },
      { status: e instanceof DeskError ? e.status : 500 },
    );
  }
}
export async function json(req: Request) {
  const raw = await req.text();
  if (raw.length > 16384) throw new DeskError(413, "Payload too large");
  try {
    return JSON.parse(raw);
  } catch {
    throw new DeskError(400, "Invalid JSON");
  }
}
