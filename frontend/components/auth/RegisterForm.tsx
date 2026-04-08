"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Eye, EyeOff, Mail, Lock, Shield, User, Phone, GraduationCap, ArrowRight, CheckCircle } from "lucide-react"
import { useAuth } from "@/lib/hooks/useAuth"
import { registrationSchema, type RegistrationFormData, getPasswordStrength } from "@/lib/utils/validators"
import { UNIVERSITY_FACULTIES } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { LoadingSpinner } from "@/components/shared/LoadingSpinner"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils/cn"

interface RegisterFormProps {
  className?: string
  redirectTo?: string
  onSuccess?: () => void
}

export function RegisterForm({ className, onSuccess }: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [registerError, setRegisterError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState(1)

  const { register } = useAuth()
  const router = useRouter()

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      studentId: "",
      email: "",
      firstName: "",
      lastName: "",
      middleName: "",
      password: "",
      confirmPassword: "",
      phone: "",
      faculty: "",
      department: "",
      course: "",
      yearOfStudy: 1,
      admissionYear: new Date().getFullYear(),
    },
  })

  const password = form.watch("password")
  const passwordStrength = password ? getPasswordStrength(password) : { score: 0, feedback: [], isValid: false }

  const onSubmit = async (data: RegistrationFormData) => {
    console.log('[RegisterForm] onSubmit called!')
    console.log('[RegisterForm] Form data:', { ...data, password: '[REDACTED]', confirmPassword: '[REDACTED]' })

    setIsLoading(true)
    setRegisterError("")

    try {
      console.log('[RegisterForm] Calling register...')
      await register(data)
      console.log('[RegisterForm] Registration successful!')

      // INSTANT REDIRECT: Navigate immediately after successful registration
      console.log('[RegisterForm] Initiating redirect to verify-email...')

      // Use router.push for instant redirect
      if (onSuccess) {
        onSuccess()
      } else {
        // Don't set isLoading to false - let the redirect happen with loading state
        router.push("/verify-email")
      }
    } catch (error: any) {
      console.error('[RegisterForm] Registration failed:', error)
      const errorMessage = error.response?.data?.message || error.message || "Registration failed. Please try again."
      setRegisterError(errorMessage)
      setIsLoading(false) // Only set loading to false on error
    }
  }

  const nextStep = () => {
    console.log('[RegisterForm] Next step button clicked, current step:', step)
    const fieldsToValidate = step === 1
      ? ["studentId", "email", "firstName", "lastName", "password", "confirmPassword"] as const
      : ["phone", "faculty", "department", "course", "yearOfStudy", "admissionYear"] as const

    console.log('[RegisterForm] Validating fields:', fieldsToValidate)

    form.trigger(fieldsToValidate).then((isValid) => {
      console.log('[RegisterForm] Validation result:', isValid)
      if (!isValid) {
        console.error('[RegisterForm] Validation errors:', form.formState.errors)
      }
      if (isValid) {
        console.log('[RegisterForm] Moving to step 2')
        setStep(2)
      }
    })
  }

  const prevStep = () => setStep(1)

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 6 }, (_, i) => i + 1)
  const admissionYears = Array.from({ length: 10 }, (_, i) => currentYear - i)

  return (
    <div className={cn("w-full", className)}>
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Create Your Account
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Join the secure digital voting platform
        </p>
      </div>

      {/* Progress indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className={cn("text-xs font-medium", step >= 1 ? "text-sage-600 dark:text-sage-400" : "text-gray-400")}>
            Personal Info
          </span>
          <span className={cn("text-xs font-medium", step >= 2 ? "text-sage-600 dark:text-sage-400" : "text-gray-400")}>
            Academic Details
          </span>
        </div>
        <Progress value={step * 50} className="h-1.5" />
      </div>

      {registerError && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{registerError}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {step === 1 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            {...field}
                            placeholder="Enter first name"
                            className="pl-10"
                            disabled={isLoading}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            {...field}
                            placeholder="Enter last name"
                            className="pl-10"
                            disabled={isLoading}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="middleName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Middle Name (Optional)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          {...field}
                          placeholder="Enter middle name"
                          className="pl-10"
                          disabled={isLoading}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="studentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student ID</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          {...field}
                          placeholder="ICT123-1234/2023"
                          className="pl-10"
                          disabled={isLoading}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Format: ICT123-1234/2023 (Course-Registration/Year)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          {...field}
                          type="email"
                          placeholder="student@students.unielect.ac.ke"
                          className="pl-10"
                          disabled={isLoading}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Use your official UniElect student email address
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a strong password"
                          className="pl-10 pr-10"
                          disabled={isLoading}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isLoading}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    {password && (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Progress value={(passwordStrength.score / 5) * 100} className="h-2 flex-1" />
                          <span className="text-xs text-gray-500">
                            {passwordStrength.score}/5
                          </span>
                        </div>
                        {passwordStrength.feedback.length > 0 && (
                          <ul className="text-xs text-gray-500 space-y-1">
                            {passwordStrength.feedback.map((feedback, index) => (
                              <li key={index} className="flex items-center space-x-1">
                                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                <span>{feedback}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          {...field}
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm your password"
                          className="pl-10 pr-10"
                          disabled={isLoading}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          disabled={isLoading}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="button"
                onClick={nextStep}
                className="w-full h-11 bg-gradient-to-r from-sage-600 to-emerald-600 hover:from-sage-700 hover:to-emerald-700 text-white shadow-lg shadow-sage-500/20 font-semibold"
                disabled={isLoading}
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number (Optional)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          {...field}
                          placeholder="+254 700 000 000"
                          className="pl-10"
                          disabled={isLoading}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Kenyan phone number for account recovery and notifications
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="faculty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Faculty</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your faculty" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {UNIVERSITY_FACULTIES.map((faculty) => (
                          <SelectItem key={faculty} value={faculty}>
                            {faculty}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., Computer Science"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="course"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., Bachelor of Science in Computer Science"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="yearOfStudy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year of Study</FormLabel>
                      <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={field.value?.toString()} disabled={isLoading}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select year" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {years.map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              Year {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="admissionYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Admission Year</FormLabel>
                      <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={field.value?.toString()} disabled={isLoading}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select year" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {admissionYears.map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  className="flex-1 h-11 border-sage-200 dark:border-sage-800 text-sage-700 dark:text-sage-300 hover:bg-sage-50 dark:hover:bg-sage-900/20 font-semibold"
                  disabled={isLoading}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-11 bg-gradient-to-r from-sage-600 to-emerald-600 hover:from-sage-700 hover:to-emerald-700 text-white shadow-lg shadow-sage-500/20 font-semibold"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  Create Account
                </Button>
              </div>
            </>
          )}
        </form>
      </Form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-sage-600 dark:text-sage-400 hover:text-sage-700 dark:hover:text-sage-300"
          >
            Sign in here
          </Link>
        </p>
      </div>

      <div className="mt-3 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Want to run for a position?{" "}
          <Link
            href="/register/candidate"
            className="font-semibold text-sage-600 dark:text-sage-400 hover:text-sage-700 dark:hover:text-sage-300"
          >
            Apply as a candidate
          </Link>
        </p>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
          <Shield className="h-3.5 w-3.5 text-sage-600 dark:text-sage-400" />
          <span>Secured by UniElect Authentication</span>
        </div>
      </div>
    </div>
  )
}

export default RegisterForm