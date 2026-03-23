import { SignIn, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import WalletDashboard from "@/components/WalletDashboard";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Chipi Wallet App
          </h1>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SignedOut>
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-center">
                Sign in to access your wallet
              </h2>
              <SignIn />
            </div>
          </div>
        </SignedOut>

        <SignedIn>
          <WalletDashboard />
        </SignedIn>
      </div>
    </main>
  );
}