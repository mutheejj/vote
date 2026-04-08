// frontend/app/(auth)/register/candidate/success/page.tsx
'use client';

import Link from 'next/link';
import { CheckCircle, Mail } from 'lucide-react';

export default function CandidateApplicationSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-emerald-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Application Submitted Successfully!
          </h2>

          <div className="mb-6">
            <div className="flex items-center justify-center text-blue-600 mb-3">
              <Mail className="h-6 w-6 mr-2" />
              <span className="text-sm font-medium">Check Your Email</span>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              Your candidate application has been received and is under review.
              You will receive an email notification once your application has been processed.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 text-sm mb-2">What happens next?</h3>
            <ul className="text-left text-sm text-blue-800 space-y-2">
              <li className="flex items-start">
                <span className="mr-2">1.</span>
                <span>Admin will review your application</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">2.</span>
                <span>You'll receive an email with the decision</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">3.</span>
                <span>If approved, you'll get a registration link</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">4.</span>
                <span>Complete your registration within 7 days</span>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <Link
              href="/"
              className="block w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              Go to Homepage
            </Link>
            <Link
              href="/login"
              className="block w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
            >
              Login to Existing Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
