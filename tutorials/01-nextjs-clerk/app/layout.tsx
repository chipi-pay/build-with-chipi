import { ClerkProvider } from "@clerk/nextjs";
import { ChipiProvider } from "@chipi-stack/nextjs";
import "./globals.css";

export const metadata = {
  title: "Chipi Wallet App",
  description: "Next.js + Clerk wallet application with Chipi SDK",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider>
          <ChipiProvider>{children}</ChipiProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}