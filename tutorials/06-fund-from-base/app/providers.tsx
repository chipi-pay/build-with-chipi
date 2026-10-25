"use client";

import { ChipiProvider } from "@chipi-stack/nextjs/client";

export function Providers({ children }: { children: React.ReactNode }) {
  return <ChipiProvider config={{ apiPublicKey: process.env.NEXT_PUBLIC_CHIPI_API_KEY! }}>{children}</ChipiProvider>;
}
