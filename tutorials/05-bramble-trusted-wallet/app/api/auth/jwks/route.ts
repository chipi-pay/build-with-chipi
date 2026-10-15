import { NextResponse } from "next/server";
import { jwks } from "@/lib/auth";

/** GET: the public key Chipi checks tokens with. Register `${APP_URL}/api/auth/jwks` in the Chipi dashboard. */
export async function GET() {
  return NextResponse.json(jwks(), { headers: { "Cache-Control": "public, max-age=300" } });
}
