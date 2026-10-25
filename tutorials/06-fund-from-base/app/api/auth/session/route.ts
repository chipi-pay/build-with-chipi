import { NextResponse } from "next/server";
import { currentUserId, endSession } from "@/lib/auth";

/** GET: who is signed in. */
export async function GET() {
  return NextResponse.json({ userId: await currentUserId() });
}

/** DELETE: sign out. The passkey wallet stays with Chipi under this user id; only the cookie goes. */
export async function DELETE() {
  await endSession();
  return NextResponse.json({ userId: null });
}
