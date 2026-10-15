import { NextResponse } from "next/server";
import { chipiToken, currentAddress } from "@/lib/auth";

/** GET: a fresh JWT for Chipi's API (15 minutes). Fetch it right before each Chipi call. */
export async function GET() {
  const address = await currentAddress();
  if (!address) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json({ token: chipiToken(address) });
}
