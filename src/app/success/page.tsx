import Link from 'next/link';

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center px-6">
      <div className="bg-[#141417] border border-white/10 rounded-3xl p-10 max-w-md w-full text-center">
        {/* Success icon */}
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-white mb-3">Payment Successful!</h1>
        <p className="text-white/50 mb-8">
          Your credits have been added to your account. You can now start generating.
        </p>

        <Link
          href="/"
          className="inline-block w-full py-3 rounded-xl font-semibold bg-[#ff7a00] text-white hover:bg-[#e66d00] transition-all"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
