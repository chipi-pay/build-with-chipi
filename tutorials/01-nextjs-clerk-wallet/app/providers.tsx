"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { ChipiProvider } from "@chipi-stack/nextjs/client";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <ChipiProvider
        config={{
          apiPublicKey: process.env.NEXT_PUBLIC_CHIPI_API_KEY!,
        }}
      >
        {children}
      </ChipiProvider>
    </ClerkProvider>
  );
}
