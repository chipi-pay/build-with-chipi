import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-green-600">Chipi Wallet</h1>
            <div>
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
                    Sign In
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <UserButton />
              </SignedIn>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Chipi Wallet
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Secure, gasless transactions on Starknet
          </p>
        </div>

        <SignedOut>
          <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md mx-auto">
            <p className="text-gray-700 mb-6">
              Sign in to create your wallet and start transacting
            </p>
            <SignInButton mode="modal">
              <button className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold">
                Get Started
              </button>
            </SignInButton>
          </div>
        </SignedOut>

        <SignedIn>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Link
              href="/wallet"
              className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Wallet Management
              </h3>
              <p className="text-gray-600">
                Create wallet, check balance, and view transactions
              </p>
            </Link>

            <Link
              href="/passkey"
              className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow"
            >
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Passkey Setup
              </h3>
              <p className="text-gray-600">
                Secure your wallet with biometric authentication
              </p>
            </Link>
          </div>
        </SignedIn>
      </main>
    </div>
  );
}