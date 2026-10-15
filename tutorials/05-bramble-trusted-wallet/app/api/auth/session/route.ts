import { NextResponse } from "next/server";
import { currentAddress, endSession } from "@/lib/auth";

/** GET: who is signed in. */
export async function GET() {
  return NextResponse.json({ address: await currentAddress() });
}

/** DELETE: sign out. */
export async function DELETE() {
  await endSession();
  return NextResponse.json({ address: null });
}
