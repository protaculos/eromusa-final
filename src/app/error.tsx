"use client";
import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0B14] px-6">
      <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
        <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
      <p className="text-white/50 text-sm mb-8 text-center max-w-md">
        An unexpected error occurred. Please try again or contact support.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="bg-[#EE5F96] hover:bg-[#d94d7e] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="bg-[#161827] hover:bg-[#1E2130] text-white font-semibold px-6 py-3 rounded-xl border border-[#1E2130] transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
