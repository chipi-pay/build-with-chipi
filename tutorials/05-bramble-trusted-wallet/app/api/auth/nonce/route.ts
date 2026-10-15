import { NextResponse } from "next/server";
import { createStarknetSignInTypedData, normalizeStarknetAddress } from "@chipi-stack/backend";
import { appUrl, issueNonce } from "@/lib/auth";

/** POST { address }: a one-time nonce and the SNIP-12 message Bramble signs. */
export async function POST(req: Request) {
  const { address } = (await req.json()) as { address?: unknown };
  if (typeof address !== "string" || !/^0x[0-9a-fA-F]{1,64}$/.test(address)) {
    return NextResponse.json({ error: "address must be a Starknet address" }, { status: 400 });
  }

  const { nonce, issued } = issueNonce(normalizeStarknetAddress(address));
  const typedData = createStarknetSignInTypedData({
    domain: new URL(appUrl()).host,
    uri: appUrl(),
    nonce,
    ...issued,
  });
  return NextResponse.json({ nonce, typedData });
}
