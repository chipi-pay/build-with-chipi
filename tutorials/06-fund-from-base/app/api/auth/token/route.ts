import { NextResponse } from "next/server";
import { chipiToken, currentUserId } from "@/lib/auth";

/** GET: a fresh JWT for Chipi's API (15 minutes). The SDK asks for one before each call, so it never expires mid-deposit. */
export async function GET() {
  const userId = await currentUserId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json({ token: chipiToken(userId) });
}
