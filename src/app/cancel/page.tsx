import Link from 'next/link';

export default function CancelPage() {
  return (
    <div className="min-h-screen bg-[#232323] flex items-center justify-center px-6">
      <div className="bg-[#141417] border border-white/10 rounded-3xl p-10 max-w-md w-full text-center">
        {/* Cancel icon */}
        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-white mb-3">Payment Cancelled</h1>
        <p className="text-white/50 mb-8">
          Your payment was not processed. No charges have been made. You can try again whenever you&apos;re ready.
        </p>

        <Link
          href="/"
          className="inline-block w-full py-3 rounded-xl font-semibold bg-white/10 text-white hover:bg-white/20 transition-all"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
