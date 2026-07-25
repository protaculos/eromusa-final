import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0B14] px-6">
      <div className="w-16 h-16 rounded-full bg-[#161827] border border-[#1E2130] flex items-center justify-center mb-6">
        <svg className="w-8 h-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h1 className="text-4xl font-bold text-white mb-2">404</h1>
      <p className="text-white/50 text-lg mb-8 text-center">Page not found</p>
      <Link
        href="/"
        className="bg-[#EE5F96] hover:bg-[#d94d7e] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
      >
        Back to Home
      </Link>
    </div>
  );
}
