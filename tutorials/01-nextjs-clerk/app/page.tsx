import { SignIn, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import WalletDashboard from "@/components/WalletDashboard";

export default function Home() {
  return (
    <main className="min-h-screen p-8 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">
            Chipi Wallet App
          </h1>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>

        <SignedOut>
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-auto">
            <h2 className="text-2xl font-semibold mb-6 text-center">
              Sign in to continue
            </h2>
            <SignIn routing="hash" />
          </div>
        </SignedOut>

        <SignedIn>
          <WalletDashboard />
        </SignedIn>
      </div>
    </main>
  );
}