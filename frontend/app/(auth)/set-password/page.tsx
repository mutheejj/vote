'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { setPasswordWithToken, clearTokens } from '@/lib/api/auth';
import { CheckCircle, XCircle, Loader2, AlertCircle, Eye, EyeOff, Lock, Shield } from 'lucide-react';

function SetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    label: '',
    color: '',
  });

  useEffect(() => {
    if (!token) {
      setError('No password reset token provided. Please use the link from your email.');
    }
  }, [token]);

  // Password strength checker
  useEffect(() => {
    const password = formData.password;
    let score = 0;

    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

    const strengths = [
      { score: 0, label: '', color: '' },
      { score: 1, label: 'Weak', color: 'bg-red-500' },
      { score: 2, label: 'Fair', color: 'bg-orange-500' },
      { score: 3, label: 'Good', color: 'bg-yellow-500' },
      { score: 4, label: 'Strong', color: 'bg-green-500' },
      { score: 5, label: 'Very Strong', color: 'bg-emerald-600' },
    ];

    setPasswordStrength(strengths[Math.min(score, 5)]);
  }, [formData.password]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Invalid token. Please use the link from your email.');
      return;
    }

    // Validation
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (passwordStrength.score < 2) {
      setError('Please choose a stronger password');
      return;
    }

    setSubmitting(true);

    try {
      const response = await setPasswordWithToken({
        token,
        newPassword: formData.password,
      });

      if (response.data.success) {
        setSuccess(true);

        // Clear any existing auth tokens to ensure clean login
        clearTokens();

        // Redirect to login page after a short delay
        // User will login with their new password
        setTimeout(() => {
          router.push('/login?message=password_set');
        }, 2500);
      } else {
        setError(response.data.message || 'Failed to set password. Please try again.');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'An error occurred. Please try again.';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sage-50 via-sage-50 to-emerald-50 dark:from-gray-950 dark:via-sage-950/20 dark:to-emerald-950/20 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 text-center border border-gray-100 dark:border-gray-800">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
              <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Invalid Link
            </h2>

            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error || 'This password reset link is invalid or has expired. Please request a new one.'}
            </p>

            <div className="space-y-3">
              <Link
                href="/login"
                className="block w-full px-4 py-3 bg-gradient-to-r from-sage-600 to-emerald-600 text-white rounded-xl hover:from-sage-700 hover:to-emerald-700 font-medium transition-all"
              >
                Go to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sage-50 via-sage-50 to-emerald-50 dark:from-gray-950 dark:via-sage-950/20 dark:to-emerald-950/20 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 text-center border border-gray-100 dark:border-gray-800">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
              <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Password Set Successfully!
            </h2>

            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your password has been set successfully. You will be redirected to the login page to sign in with your new credentials.
            </p>

            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-sage-600 animate-spin" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">Redirecting...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-sage-50 via-sage-50 to-emerald-50 dark:from-gray-950 dark:via-sage-950/20 dark:to-emerald-950/20 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-sage-200/40 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-emerald-200/40 to-transparent rounded-full blur-3xl"></div>

        <div className="relative z-10 w-full max-w-md">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-800">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-xl bg-gradient-to-br from-sage-600 to-emerald-600 mb-4">
                <Lock className="h-7 w-7 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Set Your Password</h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Create a secure password for your account
              </p>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl flex items-start">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={8}
                    className="block w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 pr-12 text-gray-900 dark:text-white placeholder-gray-500 focus:border-sage-500 focus:ring-2 focus:ring-sage-500/20 transition-all"
                    placeholder="Enter your new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${passwordStrength.color}`}
                          style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium ${
                        passwordStrength.score <= 2 ? 'text-red-600' :
                        passwordStrength.score === 3 ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    minLength={8}
                    className="block w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 pr-12 text-gray-900 dark:text-white placeholder-gray-500 focus:border-sage-500 focus:ring-2 focus:ring-sage-500/20 transition-all"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
                )}
                {formData.confirmPassword && formData.password === formData.confirmPassword && formData.password.length >= 8 && (
                  <p className="mt-1 text-sm text-green-600 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1" /> Passwords match
                  </p>
                )}
              </div>

              {/* Password Requirements */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                <div className="flex items-start">
                  <Shield className="h-5 w-5 text-sage-600 mr-2 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <p className="font-medium mb-2 text-gray-900 dark:text-white">Password Requirements:</p>
                    <ul className="space-y-1">
                      <li className={formData.password.length >= 8 ? 'text-green-600' : ''}>
                        {formData.password.length >= 8 ? '✓' : '○'} At least 8 characters
                      </li>
                      <li className={/[A-Z]/.test(formData.password) && /[a-z]/.test(formData.password) ? 'text-green-600' : ''}>
                        {/[A-Z]/.test(formData.password) && /[a-z]/.test(formData.password) ? '✓' : '○'} Mix of upper and lowercase letters
                      </li>
                      <li className={/\d/.test(formData.password) ? 'text-green-600' : ''}>
                        {/\d/.test(formData.password) ? '✓' : '○'} At least one number
                      </li>
                      <li className={/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? 'text-green-600' : ''}>
                        {/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? '✓' : '○'} Special character (recommended)
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || formData.password !== formData.confirmPassword || formData.password.length < 8}
                className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-sage-600 to-emerald-600 text-white rounded-xl hover:from-sage-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-sage-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Setting Password...
                  </>
                ) : (
                  <>
                    <Lock className="h-5 w-5 mr-2" />
                    Set Password & Continue
                  </>
                )}
              </button>

              <div className="text-center">
                <Link
                  href="/login"
                  className="text-sm text-sage-600 hover:text-sage-700 dark:text-sage-400"
                >
                  Already have an account? Sign in
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Right Side - Branding */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden min-h-screen">
        <div className="absolute inset-0">
          <Image
            src="/images/vote-illustration3.jpg"
            alt="Secure voting"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-br from-sage-900/90 via-sage-900/85 to-emerald-900/90"></div>
        </div>

        <div className="relative z-10 flex items-center justify-center p-12 w-full">
          <div className="max-w-xl">
            <div className="flex items-center gap-3 mb-8 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-sage-400 to-emerald-400 rounded-xl opacity-30 blur-xl group-hover:opacity-40 transition-opacity"></div>
                <Image
                  src="/images/unielect-logo.jpg"
                  alt="UniElect"
                  width={64}
                  height={64}
                  className="rounded-xl shadow-2xl relative"
                />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">UniElect</h2>
                <p className="text-emerald-300 text-sm font-semibold">Student Voting Portal</p>
              </div>
            </div>

            <h3 className="text-4xl font-bold text-white mb-6 leading-tight">
              Welcome to Your Campaign Journey
            </h3>
            <p className="text-xl text-gray-100 mb-8 leading-relaxed">
              Your candidate application has been approved! Set your password to access your candidate dashboard and start your campaign.
            </p>

            <div className="space-y-4 bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl">
              <h4 className="text-lg font-semibold text-emerald-300 mb-4">What's Next?</h4>

              <div className="flex items-start gap-3 text-gray-50">
                <div className="w-6 h-6 bg-gradient-to-r from-sage-400 to-emerald-400 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">1</div>
                <div>
                  <p className="font-semibold">Set Your Password</p>
                  <p className="text-sm text-gray-200">Create a secure password for your account</p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-gray-50">
                <div className="w-6 h-6 bg-gradient-to-r from-sage-400 to-emerald-400 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">2</div>
                <div>
                  <p className="font-semibold">Complete Your Profile</p>
                  <p className="text-sm text-gray-200">Add your photo and detailed manifesto</p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-gray-50">
                <div className="w-6 h-6 bg-gradient-to-r from-sage-400 to-emerald-400 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">3</div>
                <div>
                  <p className="font-semibold">Start Your Campaign</p>
                  <p className="text-sm text-gray-200">Engage with voters and share your vision</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-sage-50 via-sage-50 to-emerald-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-sage-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SetPasswordContent />
    </Suspense>
  );
}
