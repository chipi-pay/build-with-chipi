import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Fund a Chipi wallet from Base",
  description: "Bring USDC from Base into a Chipi passkey wallet on Starknet with Circle's CCTP: quote both speeds, burn, close the page, arrive",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
