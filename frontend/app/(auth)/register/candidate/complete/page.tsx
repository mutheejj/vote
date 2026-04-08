// frontend/app/(auth)/register/candidate/complete/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { verifyApprovalToken, completeRegistration, CompleteRegistrationRequest } from '@/lib/api/candidatePreRegistration';
import { CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';

function CandidateCompleteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [tokenValid, setTokenValid] = useState(false);
  const [applicationData, setApplicationData] = useState<any>(null);

  const [formData, setFormData] = useState<CompleteRegistrationRequest>({
    token: token || '',
    password: '',
    confirmPassword: '',
    admissionYear: new Date().getFullYear()
  });

  useEffect(() => {
    if (!token) {
      setError('No registration token provided');
      setVerifying(false);
      setLoading(false);
      return;
    }

    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    if (!token) return;

    try {
      const response = await verifyApprovalToken(token);

      if (response.data.valid && response.data.application) {
        setTokenValid(true);
        setApplicationData(response.data.application);
        setFormData(prev => ({ ...prev, token }));
      } else {
        setError(response.data.message || 'Invalid or expired registration link');
        setTokenValid(false);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to verify registration link');
      setTokenValid(false);
    } finally {
      setVerifying(false);
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'admissionYear' ? parseInt(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);

    try {
      const response = await completeRegistration(formData);

      if (response.data.success && response.data.data) {
        // Store tokens
        localStorage.setItem('unielect-voting-access-token', response.data.data.tokens.accessToken);
        localStorage.setItem('unielect-voting-refresh-token', response.data.data.tokens.refreshToken);

        // Store user data
        localStorage.setItem('unielect-voting-user', JSON.stringify(response.data.data.user));

        // Redirect to dashboard or elections page
        router.push('/elections');
      } else {
        setError(response.data.message || 'Failed to complete registration');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-emerald-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Verifying your registration link...</p>
        </div>
      </div>
    );
  }

  if (!tokenValid || !applicationData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-emerald-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-xl p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Invalid Registration Link
            </h2>

            <p className="text-gray-600 mb-6">
              {error || 'This registration link is invalid or has expired. Please check your email for the correct link or contact support.'}
            </p>

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-emerald-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Complete Your Registration</h2>
            <p className="mt-2 text-sm text-gray-600">
              Your candidate application has been approved! Complete your registration to continue.
            </p>
          </div>

          {/* Application Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 text-sm mb-3">Application Details</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-blue-700 font-medium">Name:</span>
                <p className="text-blue-900">
                  {applicationData.firstName} {applicationData.middleName} {applicationData.lastName}
                </p>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Student ID:</span>
                <p className="text-blue-900">{applicationData.studentId}</p>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Email:</span>
                <p className="text-blue-900">{applicationData.email}</p>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Position:</span>
                <p className="text-blue-900">{applicationData.intendedPosition}</p>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Faculty:</span>
                <p className="text-blue-900">{applicationData.faculty}</p>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Year:</span>
                <p className="text-blue-900">Year {applicationData.yearOfStudy}</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="admissionYear" className="block text-sm font-medium text-gray-700">
                Admission Year *
              </label>
              <select
                id="admissionYear"
                name="admissionYear"
                value={formData.admissionYear}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
              >
                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Select the year you were admitted to the university
              </p>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password *
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={8}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                placeholder="Minimum 8 characters"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password *
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength={8}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 px-3 py-2 border"
                placeholder="Re-enter your password"
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Important:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Choose a strong password with at least 8 characters</li>
                    <li>Include uppercase, lowercase, numbers, and special characters</li>
                    <li>Do not share your password with anyone</li>
                    <li>You will be logged in automatically after registration</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-6">
              <Link
                href="/"
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Back to Homepage
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Completing Registration...
                  </>
                ) : (
                  'Complete Registration'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function CandidateCompletePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-emerald-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <CandidateCompleteContent />
    </Suspense>
  );
}
