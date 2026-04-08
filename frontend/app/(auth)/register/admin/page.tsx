// frontend/app/(auth)/register/admin/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { verifyInvitationToken, completeInvitation, CompleteInvitationRequest } from '@/lib/api/adminInvitations';
import { UNIVERSITY_FACULTIES } from '@/lib/enums';
import { CheckCircle, XCircle, Loader2, AlertCircle, Shield } from 'lucide-react';

function AdminRegistrationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [tokenValid, setTokenValid] = useState(false);
  const [invitationData, setInvitationData] = useState<any>(null);

  const [formData, setFormData] = useState<CompleteInvitationRequest>({
    token: token || '',
    studentId: '',
    firstName: '',
    lastName: '',
    middleName: '',
    phone: '',
    password: '',
    confirmPassword: '',
    faculty: '',
    department: '',
    course: '',
    yearOfStudy: 1,
    admissionYear: new Date().getFullYear()
  });

  useEffect(() => {
    if (!token) {
      setError('No invitation token provided');
      setVerifying(false);
      setLoading(false);
      return;
    }

    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    if (!token) return;

    try {
      const response = await verifyInvitationToken(token);

      if (response.data.valid && response.data.invitation) {
        setTokenValid(true);
        setInvitationData(response.data.invitation);
        setFormData(prev => ({ ...prev, token }));
      } else {
        setError(response.data.message || 'Invalid or expired invitation link');
        setTokenValid(false);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to verify invitation link');
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
      [name]: name === 'yearOfStudy' || name === 'admissionYear' ? parseInt(value) : value
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
      const response = await completeInvitation(formData);

      if (response.data.success && response.data.data) {
        // Store tokens
        localStorage.setItem('unielect-voting-access-token', response.data.data.tokens.accessToken);
        localStorage.setItem('unielect-voting-refresh-token', response.data.data.tokens.refreshToken);

        // Store user data
        localStorage.setItem('unielect-voting-user', JSON.stringify(response.data.data.user));

        // Redirect to admin dashboard
        router.push('/admin/dashboard');
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
      <div className="min-h-screen bg-gradient-to-br from-sage-50 to-emerald-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-sage-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Verifying your invitation...</p>
        </div>
      </div>
    );
  }

  if (!tokenValid || !invitationData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sage-50 to-emerald-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-xl p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Invalid Invitation Link
            </h2>

            <p className="text-gray-600 mb-6">
              {error || 'This invitation link is invalid or has expired. Please contact the system administrator for a new invitation.'}
            </p>

            <div className="space-y-3">
              <Link
                href="/"
                className="block w-full px-4 py-2 bg-sage-600 text-white rounded-md hover:bg-sage-700 font-medium"
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
    <div className="min-h-screen bg-gradient-to-br from-sage-50 to-emerald-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-sage-100 mb-4">
              <Shield className="h-10 w-10 text-sage-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Admin Registration</h2>
            <p className="mt-2 text-sm text-gray-600">
              Complete your registration as {invitationData.role === 'ADMIN' ? 'an Administrator' : 'a Moderator'}
            </p>
          </div>

          {/* Invitation Summary */}
          <div className="bg-sage-50 border border-sage-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-sage-900 text-sm mb-3">Invitation Details</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-sage-700 font-medium">Email:</span>
                <p className="text-sage-900">{invitationData.email}</p>
              </div>
              <div>
                <span className="text-sage-700 font-medium">Role:</span>
                <p className="text-sage-900">
                  {invitationData.role === 'ADMIN' ? 'Administrator' : 'Moderator'}
                </p>
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
            {/* Personal Information */}
            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="studentId" className="block text-sm font-medium text-gray-700">
                    Student ID *
                  </label>
                  <input
                    type="text"
                    id="studentId"
                    name="studentId"
                    value={formData.studentId}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sage-500 focus:ring-sage-500 px-3 py-2 border"
                    placeholder="e.g., CS101-2020/2024"
                  />
                </div>

                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    First Name *
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sage-500 focus:ring-sage-500 px-3 py-2 border"
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sage-500 focus:ring-sage-500 px-3 py-2 border"
                  />
                </div>

                <div>
                  <label htmlFor="middleName" className="block text-sm font-medium text-gray-700">
                    Middle Name
                  </label>
                  <input
                    type="text"
                    id="middleName"
                    name="middleName"
                    value={formData.middleName}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sage-500 focus:ring-sage-500 px-3 py-2 border"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sage-500 focus:ring-sage-500 px-3 py-2 border"
                    placeholder="+254712345678"
                  />
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Academic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="faculty" className="block text-sm font-medium text-gray-700">
                    Faculty
                  </label>
                  <select
                    id="faculty"
                    name="faculty"
                    value={formData.faculty}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sage-500 focus:ring-sage-500 px-3 py-2 border"
                  >
                    <option value="">Select Faculty (Optional)</option>
                    {Object.entries(UNIVERSITY_FACULTIES).map(([key, value]) => (
                      <option key={key} value={key}>{value}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                    Department
                  </label>
                  <input
                    type="text"
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sage-500 focus:ring-sage-500 px-3 py-2 border"
                  />
                </div>

                <div>
                  <label htmlFor="course" className="block text-sm font-medium text-gray-700">
                    Course
                  </label>
                  <input
                    type="text"
                    id="course"
                    name="course"
                    value={formData.course}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sage-500 focus:ring-sage-500 px-3 py-2 border"
                  />
                </div>

                <div>
                  <label htmlFor="yearOfStudy" className="block text-sm font-medium text-gray-700">
                    Year of Study
                  </label>
                  <select
                    id="yearOfStudy"
                    name="yearOfStudy"
                    value={formData.yearOfStudy}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sage-500 focus:ring-sage-500 px-3 py-2 border"
                  >
                    {[1, 2, 3, 4, 5, 6].map(year => (
                      <option key={year} value={year}>Year {year}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="admissionYear" className="block text-sm font-medium text-gray-700">
                    Admission Year
                  </label>
                  <select
                    id="admissionYear"
                    name="admissionYear"
                    value={formData.admissionYear}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sage-500 focus:ring-sage-500 px-3 py-2 border"
                  >
                    {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Security */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Security</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sage-500 focus:ring-sage-500 px-3 py-2 border"
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
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sage-500 focus:ring-sage-500 px-3 py-2 border"
                    placeholder="Re-enter your password"
                  />
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Important Admin Guidelines:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>As an admin, you have elevated privileges and responsibilities</li>
                    <li>Use a strong, unique password for your account</li>
                    <li>Never share your credentials with anyone</li>
                    <li>All administrative actions are logged and audited</li>
                    <li>Report any security concerns immediately</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-6">
              <Link
                href="/"
                className="text-sm text-sage-600 hover:text-sage-500"
              >
                Back to Homepage
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-sage-600 text-white rounded-md hover:bg-sage-700 focus:outline-none focus:ring-2 focus:ring-sage-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center"
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

export default function AdminRegistrationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-sage-50 to-emerald-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-sage-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <AdminRegistrationContent />
    </Suspense>
  );
}
