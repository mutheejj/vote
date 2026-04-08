// frontend/app/(auth)/register/candidate/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { submitApplication, SubmitApplicationRequest, getOpenElections } from '@/lib/api/candidatePreRegistration';
import { UNIVERSITY_FACULTIES } from '@/lib/enums';
import { ThemeToggle } from '@/components/shared/ThemeToggle';

export default function CandidateApplicationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [adminWarning, setAdminWarning] = useState('');
  const [selectedElectionId, setSelectedElectionId] = useState('');

  const [formData, setFormData] = useState<SubmitApplicationRequest>({
    studentId: '',
    email: '',
    firstName: '',
    lastName: '',
    middleName: '',
    phone: '',
    faculty: '',
    department: '',
    course: '',
    yearOfStudy: 1,
    intendedPosition: '',
    electionId: '',
    positionId: '',
    reason: ''
  });

  // Fetch open elections
  const { data: electionsData, isLoading: electionsLoading } = useQuery({
    queryKey: ['open-elections'],
    queryFn: async () => {
      const response = await getOpenElections();
      return response.data.data || [];
    }
  });

  // Get available positions based on selected election
  const availablePositions = useMemo(() => {
    if (!selectedElectionId || !electionsData) return [];
    const selectedElection = electionsData.find((e: any) => e.id === selectedElectionId);
    return selectedElection?.positions || [];
  }, [selectedElectionId, electionsData]);

  // Check for admin email patterns
  useEffect(() => {
    const emailLower = formData.email.toLowerCase();
    const adminPatterns = ['admin', 'moderator', 'superadmin', 'administrator'];

    if (adminPatterns.some(pattern => emailLower.includes(pattern))) {
      setAdminWarning('Warning: Administrative accounts cannot register as candidates. If this is an admin email, the application will be rejected.');
    } else {
      setAdminWarning('');
    }
  }, [formData.email]);

  // Handle election selection
  const handleElectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const electionId = e.target.value;
    setSelectedElectionId(electionId);
    setFormData(prev => ({
      ...prev,
      electionId,
      positionId: '', // Reset position when election changes
      intendedPosition: '' // Reset intended position text
    }));
  };

  // Handle position selection
  const handlePositionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const positionId = e.target.value;
    const selectedPosition = availablePositions.find((p: any) => p.id === positionId);

    setFormData(prev => ({
      ...prev,
      positionId,
      intendedPosition: selectedPosition?.name || '' // Auto-fill intended position
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'yearOfStudy' ? parseInt(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.electionId) {
      setError('Please select an election');
      return;
    }
    if (!formData.positionId) {
      setError('Please select a position');
      return;
    }

    setLoading(true);

    try {
      const response = await submitApplication(formData);

      if (response.data.success) {
        router.push('/register/candidate/success');
      } else {
        setError(response.data.message || 'Failed to submit application');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = "mt-1 block w-full rounded-xl border-sage-200 dark:border-sage-700 dark:bg-gray-800/50 dark:text-white shadow-sm focus:border-sage-500 focus:ring-sage-500 px-4 py-3 border transition-all text-sm";
  const selectClasses = "mt-1 block w-full rounded-xl border-sage-200 dark:border-sage-700 dark:bg-gray-800/50 dark:text-white shadow-sm focus:border-sage-500 focus:ring-sage-500 px-4 py-3 border transition-all text-sm";

  return (
    <div className="min-h-screen relative">
      {/* Full Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/images/vote-illustration2.jpg"
          alt="Online voting platform"
          fill
          className="object-cover"
          priority
        />
        {/* Gradient overlay with sage green tones */}
        <div className="absolute inset-0 bg-gradient-to-br from-sage-900/90 via-emerald-900/85 to-green-900/90 dark:from-gray-950/95 dark:via-sage-950/90 dark:to-emerald-950/95"></div>
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 bg-grid-white/10 opacity-30"></div>
      </div>

      {/* Theme Toggle - Fixed Position */}
      <div className="absolute top-6 right-6 z-30">
        <ThemeToggle />
      </div>

      {/* Content Container */}
      <div className="relative z-10 min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl w-full">
          <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 lg:p-10 border border-white/20 dark:border-gray-800/50">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="mx-auto mb-6 relative group inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-sage-400 to-emerald-400 rounded-xl opacity-30 blur-xl group-hover:opacity-40 transition-opacity"></div>
                <Image
                  src="/images/unielect-logo.jpg"
                  alt="UniElect Logo"
                  width={64}
                  height={64}
                  className="mx-auto rounded-xl object-cover relative shadow-xl"
                />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Candidate Application</h2>
              <p className="text-gray-600 dark:text-gray-300">
                Apply to become a candidate for upcoming elections
              </p>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {adminWarning && (
              <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 px-4 py-3 rounded-xl text-sm">
                {adminWarning}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Election Selection */}
              <div className="border-b border-sage-200 dark:border-sage-800 pb-6">
                <h3 className="text-lg font-semibold bg-gradient-to-r from-sage-600 to-emerald-600 bg-clip-text text-transparent mb-4">Election Selection</h3>

                {electionsLoading ? (
                  <div className="text-center py-4 text-gray-600 dark:text-gray-400">
                    Loading available elections...
                  </div>
                ) : !electionsData || electionsData.length === 0 ? (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 px-4 py-3 rounded-xl text-sm">
                    No elections are currently accepting candidate applications. Please check back later.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="electionId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Select Election *
                      </label>
                      <select
                        id="electionId"
                        name="electionId"
                        value={selectedElectionId}
                        onChange={handleElectionChange}
                        required
                        className={selectClasses}
                      >
                        <option value="">Choose an election</option>
                        {electionsData.map((election: any) => (
                          <option key={election.id} value={election.id}>
                            {election.title}
                          </option>
                        ))}
                      </select>
                      {selectedElectionId && (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {electionsData.find((e: any) => e.id === selectedElectionId)?.description}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="positionId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Select Position *
                      </label>
                      <select
                        id="positionId"
                        name="positionId"
                        value={formData.positionId}
                        onChange={handlePositionChange}
                        required
                        disabled={!selectedElectionId || availablePositions.length === 0}
                        className={`${selectClasses} disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <option value="">
                          {!selectedElectionId
                            ? 'Select an election first'
                            : availablePositions.length === 0
                            ? 'No positions available'
                            : 'Choose a position'}
                        </option>
                        {availablePositions.map((position: any) => (
                          <option key={position.id} value={position.id}>
                            {position.name}
                          </option>
                        ))}
                      </select>
                      {formData.positionId && (
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {availablePositions.find((p: any) => p.id === formData.positionId)?.description}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Personal Information */}
              <div className="border-b border-sage-200 dark:border-sage-800 pb-6">
                <h3 className="text-lg font-semibold bg-gradient-to-r from-sage-600 to-emerald-600 bg-clip-text text-transparent mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="studentId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Student ID *
                    </label>
                    <input
                      type="text"
                      id="studentId"
                      name="studentId"
                      value={formData.studentId}
                      onChange={handleChange}
                      required
                      className={inputClasses}
                      placeholder="e.g., CS101-2020/2024"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className={inputClasses}
                    />
                  </div>

                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      First Name *
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                      className={inputClasses}
                    />
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                      className={inputClasses}
                    />
                  </div>

                  <div>
                    <label htmlFor="middleName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Middle Name
                    </label>
                    <input
                      type="text"
                      id="middleName"
                      name="middleName"
                      value={formData.middleName}
                      onChange={handleChange}
                      className={inputClasses}
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={inputClasses}
                      placeholder="+254712345678"
                    />
                  </div>
                </div>
              </div>

              {/* Academic Information */}
              <div className="border-b border-sage-200 dark:border-sage-800 pb-6">
                <h3 className="text-lg font-semibold bg-gradient-to-r from-sage-600 to-emerald-600 bg-clip-text text-transparent mb-4">Academic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="faculty" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Faculty *
                    </label>
                    <select
                      id="faculty"
                      name="faculty"
                      value={formData.faculty}
                      onChange={handleChange}
                      required
                      className={selectClasses}
                    >
                      <option value="">Select Faculty</option>
                      {Object.entries(UNIVERSITY_FACULTIES).map(([key, value]) => (
                        <option key={key} value={key}>{value}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="department" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Department *
                    </label>
                    <input
                      type="text"
                      id="department"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      required
                      className={inputClasses}
                    />
                  </div>

                  <div>
                    <label htmlFor="course" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Course *
                    </label>
                    <input
                      type="text"
                      id="course"
                      name="course"
                      value={formData.course}
                      onChange={handleChange}
                      required
                      className={inputClasses}
                    />
                  </div>

                  <div>
                    <label htmlFor="yearOfStudy" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Year of Study *
                    </label>
                    <select
                      id="yearOfStudy"
                      name="yearOfStudy"
                      value={formData.yearOfStudy}
                      onChange={handleChange}
                      required
                      className={selectClasses}
                    >
                      {[1, 2, 3, 4, 5, 6].map(year => (
                        <option key={year} value={year}>Year {year}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Candidacy Information */}
              <div>
                <h3 className="text-lg font-semibold bg-gradient-to-r from-sage-600 to-emerald-600 bg-clip-text text-transparent mb-4">Candidacy Statement</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Why do you want to be a candidate? * (Minimum 100 characters)
                    </label>
                    <textarea
                      id="reason"
                      name="reason"
                      value={formData.reason}
                      onChange={handleChange}
                      required
                      rows={5}
                      minLength={100}
                      maxLength={2000}
                      className={`${inputClasses} resize-none`}
                      placeholder="Explain your motivation, qualifications, and what you hope to achieve..."
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {formData.reason.length}/2000 characters
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-6">
                <Link
                  href="/register"
                  className="text-sm font-semibold bg-gradient-to-r from-sage-600 to-emerald-600 bg-clip-text text-transparent hover:from-sage-700 hover:to-emerald-700"
                >
                  Back to Registration
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-gradient-to-r from-sage-600 to-emerald-600 hover:from-sage-700 hover:to-emerald-700 text-white rounded-xl shadow-lg shadow-sage-500/25 focus:outline-none focus:ring-2 focus:ring-sage-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm transition-all"
                >
                  {loading ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
