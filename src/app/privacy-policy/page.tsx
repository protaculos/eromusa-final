"use client";
import React from 'react';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen">
      <div className="pt-8 pb-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-[#F97316] hover:text-[#e66d00] text-sm font-semibold transition-colors">
            &larr; Back to Home
          </Link>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-white/40 text-sm mb-10">Last updated: 17 October 2025</p>

        <div className="space-y-8 text-white/70 leading-relaxed">
          <section>
            <p>
              This Privacy Policy explains how <strong className="text-white">EroMusa</strong> (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) collects, uses, stores, and protects your personal data when you use our website and services at <a href="https://eromusa.com" className="text-[#F97316] hover:text-[#e66d00] transition-colors">eromusa.com</a> (the &quot;Service&quot;). We are committed to protecting your privacy and handling your data with transparency and care.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. What Data We Collect</h2>
            <h3 className="text-lg font-medium text-white/80 mt-4 mb-2">1.1 Information You Provide</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong className="text-white/80">Account Information:</strong> When you create an account, we collect your email address and a username.</li>
              <li><strong className="text-white/80">Payment Information:</strong> When you purchase credits, payment processing is handled by our third-party payment processor. We do not store full credit card numbers or banking details on our servers.</li>
              <li><strong className="text-white/80">Uploaded Images:</strong> Images you upload for video generation are processed and stored temporarily to provide the Service.</li>
              <li><strong className="text-white/80">Generated Videos:</strong> Videos created through the Service are stored in your account.</li>
              <li><strong className="text-white/80">Communications:</strong> If you contact our support team, we collect the contents of your messages.</li>
            </ul>
            <h3 className="text-lg font-medium text-white/80 mt-4 mb-2">1.2 Information Collected Automatically</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong className="text-white/80">Usage Data:</strong> Pages visited, features used, time spent on the Service.</li>
              <li><strong className="text-white/80">Device Information:</strong> Browser type, operating system, IP address.</li>
              <li><strong className="text-white/80">Cookies:</strong> We use essential cookies for authentication and functionality. Analytics cookies are used only with your consent.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. How We Use Your Data</h2>
            <p>We use your data for the following purposes:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>To provide, maintain and improve the Service.</li>
              <li>To process your transactions and manage your account.</li>
              <li>To generate AI videos from your uploaded images.</li>
              <li>To communicate with you about your account, including billing and support.</li>
              <li>To detect, prevent and address fraud, abuse or security issues.</li>
              <li>To comply with legal obligations.</li>
              <li>To send service-related announcements (e.g., changes to our terms or policies).</li>
            </ul>
            <p className="mt-2">
              <strong className="text-white/80">We do not</strong> use your uploaded images or generated videos for training AI models, marketing, or any purpose other than providing the Service to you, unless we obtain your explicit consent.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Legal Basis for Processing (GDPR)</h2>
            <p>If you are in the European Economic Area (EEA), our legal basis for processing your data includes:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong className="text-white/80">Contractual Necessity:</strong> Processing required to perform our contract with you (e.g., providing the Service, processing payments).</li>
              <li><strong className="text-white/80">Consent:</strong> Where you have given consent (e.g., cookies, marketing emails).</li>
              <li><strong className="text-white/80">Legitimate Interests:</strong> For security, fraud prevention, and service improvement, where our interests do not override your privacy rights.</li>
              <li><strong className="text-white/80">Legal Obligation:</strong> Where we are required to process data by law.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Data Sharing and Third Parties</h2>
            <p>We may share your data with:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong className="text-white/80">Payment Processors:</strong> To process your payments securely.</li>
              <li><strong className="text-white/80">AI Model Providers:</strong> To generate videos from your uploaded images. These providers are contractually bound to process data only for this purpose and not to retain or use it for their own purposes.</li>
              <li><strong className="text-white/80">Hosting Providers:</strong> To store your data securely.</li>
              <li><strong className="text-white/80">Law Enforcement:</strong> If required by law or to protect our rights.</li>
            </ul>
            <p className="mt-2">
              We do not sell your personal data to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Data Retention</h2>
            <p>We retain your data for as long as your account is active or as needed to provide the Service. Specifically:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong className="text-white/80">Account Information:</strong> Retained until you delete your account.</li>
              <li><strong className="text-white/80">Uploaded Images:</strong> Deleted after video generation is complete, or retained in your account history until you delete them.</li>
              <li><strong className="text-white/80">Generated Videos:</strong> Stored in your account until you delete them or delete your account.</li>
              <li><strong className="text-white/80">Payment Records:</strong> Retained as required by tax and financial regulations (typically 5 years).</li>
              <li><strong className="text-white/80">Usage Logs:</strong> Retained for up to 12 months for security and analytics.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your data, including encryption in transit (TLS) and at rest, access controls, and regular security audits. However, no method of transmission or storage is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. International Data Transfers</h2>
            <p>
              Your data may be transferred to and processed in countries other than your own, including countries that may not have the same data protection laws. When we transfer data from the EEA, we use appropriate safeguards such as Standard Contractual Clauses (SCCs) approved by the European Commission.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Your Rights</h2>
            <p>Depending on your jurisdiction, you may have the following rights:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Access your personal data.</li>
              <li>Rectify inaccurate data.</li>
              <li>Delete your data (&quot;right to be forgotten&quot;).</li>
              <li>Restrict processing.</li>
              <li>Data portability.</li>
              <li>Withdraw consent at any time (processing prior to withdrawal remains lawful).</li>
            </ul>
            <p className="mt-2">
              You can exercise these rights by contacting us at <a href="mailto:privacy@eromusa.com" className="text-[#F97316] hover:text-[#e66d00] transition-colors">privacy@eromusa.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Delete Your Account</h2>
            <p>You can permanently delete your EroMusa account at any time:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Sign in and go to Settings &rarr; Delete Account.</li>
              <li>Deletion is irreversible. All credits, videos, uploaded images and personal data will be completely erased from our systems and we do not retain any copies of your content after deletion, except where retention is required by law (e.g., fraud-prevention and bookkeeping records which do not include your content).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Children&apos;s Privacy</h2>
            <p>
              The Service is not directed to children under 18. We do not knowingly collect personal data from minors. If you believe a child has provided us with personal data, please contact us to delete it.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy periodically. We will post the revised version and revise the &quot;Last updated&quot; date. Material changes will be notified by email or prominent notice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">12. Contact Us</h2>
            <p>
              For questions about privacy, please email <a href="mailto:privacy@eromusa.com" className="text-[#F97316] hover:text-[#e66d00] transition-colors">privacy@eromusa.com</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
