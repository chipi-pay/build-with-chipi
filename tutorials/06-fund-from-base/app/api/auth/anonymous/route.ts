import { NextResponse } from "next/server";
import { currentUserId, startAnonymousSession } from "@/lib/auth";

/** POST: start (or keep) an anonymous account. The id becomes the JWT's `sub` and Chipi's `externalUserId`. */
export async function POST() {
  const existing = await currentUserId();
  return NextResponse.json({ userId: existing ?? (await startAnonymousSession()) });
}
