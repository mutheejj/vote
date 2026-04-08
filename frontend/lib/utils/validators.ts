// lib/utils/validators.ts
// Validation utilities matching backend validation rules

import { z } from 'zod';
import { VALIDATION_RULES } from '../constants';
import { ElectionType, UserRole, CandidateStatus, ElectionStatus } from '../enums';

// User Validation Schemas
export const studentIdSchema = z
  .string()
  .min(VALIDATION_RULES.USER.STUDENT_ID.MIN_LENGTH, 'Student ID is too short')
  .max(VALIDATION_RULES.USER.STUDENT_ID.MAX_LENGTH, 'Student ID is too long')
  .regex(VALIDATION_RULES.USER.STUDENT_ID.PATTERN, 'Invalid student ID format (e.g., ICT123-1234/2023)');

export const emailSchema = z
  .string()
  .email('Invalid email format')
  .regex(VALIDATION_RULES.USER.EMAIL.PATTERN, 'Invalid email format');

export const passwordSchema = z
  .string()
  .min(VALIDATION_RULES.USER.PASSWORD.MIN_LENGTH, 'Password must be at least 8 characters')
  .max(VALIDATION_RULES.USER.PASSWORD.MAX_LENGTH, 'Password is too long')
  .regex(
    VALIDATION_RULES.USER.PASSWORD.PATTERN,
    'Password must contain uppercase, lowercase, number, and special character'
  );

export const phoneSchema = z
  .string()
  .optional()
  .refine((phone) => {
    if (!phone) return true;
    return VALIDATION_RULES.USER.PHONE.PATTERN.test(phone);
  }, 'Invalid Kenyan phone number format');

export const nameSchema = z
  .string()
  .min(VALIDATION_RULES.USER.NAME.MIN_LENGTH, 'Name is too short')
  .max(VALIDATION_RULES.USER.NAME.MAX_LENGTH, 'Name is too long')
  .regex(VALIDATION_RULES.USER.NAME.PATTERN, 'Name can only contain letters, spaces, hyphens, and apostrophes');

// Registration Schema
export const registrationSchema = z
  .object({
    studentId: studentIdSchema,
    email: emailSchema,
    firstName: nameSchema,
    lastName: nameSchema,
    middleName: nameSchema.optional(),
    password: passwordSchema,
    confirmPassword: z.string(),
    phone: phoneSchema,
    faculty: z.string().min(1, 'Faculty is required'),
    department: z.string().min(1, 'Department is required'),
    course: z.string().min(1, 'Course is required'),
    yearOfStudy: z.number().min(1).max(6),
    admissionYear: z.number().min(2000).max(new Date().getFullYear()),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// Login Schema
export const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or Student ID is required'),
  password: z.string().min(1, 'Password is required'),
  twoFactorCode: z.string().optional(),
});

// Election Validation Schemas
export const positionSchema = z.object({
  name: z.string().min(1, 'Position name is required').max(100, 'Position name is too long'),
  description: z.string().optional(),
  order: z.number().min(1, 'Order must be at least 1'),
  maxSelections: z.number().min(1, 'Must allow at least 1 selection'),
  minSelections: z.number().min(0, 'Minimum selections cannot be negative'),
}).refine((data) => data.minSelections <= data.maxSelections, {
  message: 'Minimum selections cannot exceed maximum selections',
  path: ['minSelections'],
});

export const electionSchema = z.object({
  title: z
    .string()
    .min(VALIDATION_RULES.ELECTION.TITLE.MIN_LENGTH, 'Title is too short')
    .max(VALIDATION_RULES.ELECTION.TITLE.MAX_LENGTH, 'Title is too long'),
  description: z
    .string()
    .min(VALIDATION_RULES.ELECTION.DESCRIPTION.MIN_LENGTH, 'Description is too short')
    .max(VALIDATION_RULES.ELECTION.DESCRIPTION.MAX_LENGTH, 'Description is too long'),
  type: z.nativeEnum(ElectionType),
  startDate: z.date(),
  endDate: z.date(),
  registrationStart: z.date().optional(),
  registrationEnd: z.date().optional(),
  eligibleFaculties: z.array(z.string()).optional(),
  eligibleDepartments: z.array(z.string()).optional(),
  eligibleCourses: z.array(z.string()).optional(),
  eligibleYears: z.array(z.number()).optional(),
  allowAbstain: z.boolean().default(true),
  requireAllPositions: z.boolean().default(false),
  showLiveResults: z.boolean().default(false),
  requireTwoFactor: z.boolean().default(false),
  positions: z
    .array(positionSchema)
    .min(VALIDATION_RULES.ELECTION.POSITIONS.MIN_COUNT, 'At least one position is required')
    .max(VALIDATION_RULES.ELECTION.POSITIONS.MAX_COUNT, 'Too many positions'),
})
.refine((data) => data.endDate > data.startDate, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

// Vote Validation Schema
export const voteSchema = z.object({
  electionId: z.string().min(1, 'Election ID is required'),
  votes: z.array(
    z.object({
      positionId: z.string().min(1, 'Position ID is required'),
      candidateIds: z.array(z.string()),
      abstain: z.boolean().optional(),
    })
  ),
  deviceFingerprint: z.string().optional(),
});

// Validation Helper Functions
export function validateStudentId(studentId: string): boolean {
  return VALIDATION_RULES.USER.STUDENT_ID.PATTERN.test(studentId);
}

export function validateEmail(email: string): boolean {
  return VALIDATION_RULES.USER.EMAIL.PATTERN.test(email);
}

export function validatePassword(password: string): boolean {
  return (
    password.length >= VALIDATION_RULES.USER.PASSWORD.MIN_LENGTH &&
    password.length <= VALIDATION_RULES.USER.PASSWORD.MAX_LENGTH &&
    VALIDATION_RULES.USER.PASSWORD.PATTERN.test(password)
  );
}

export function validatePhoneNumber(phone: string): boolean {
  return VALIDATION_RULES.USER.PHONE.PATTERN.test(phone);
}

export function validateFileSize(file: File, maxSize: number): boolean {
  return file.size <= maxSize;
}

export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

// Password Strength Checker
export function getPasswordStrength(password: string): {
  score: number;
  feedback: string[];
  isValid: boolean;
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length < 8) {
    feedback.push('Use at least 8 characters');
  } else {
    score += 1;
  }

  if (!/[a-z]/.test(password)) {
    feedback.push('Add lowercase letters');
  } else {
    score += 1;
  }

  if (!/[A-Z]/.test(password)) {
    feedback.push('Add uppercase letters');
  } else {
    score += 1;
  }

  if (!/\d/.test(password)) {
    feedback.push('Add numbers');
  } else {
    score += 1;
  }

  if (!/[@$!%*?&]/.test(password)) {
    feedback.push('Add special characters (@$!%*?&)');
  } else {
    score += 1;
  }

  return {
    score,
    feedback,
    isValid: score === 5,
  };
}

// Type exports
export type RegistrationFormData = z.infer<typeof registrationSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type ElectionFormData = z.infer<typeof electionSchema>;
export type VoteData = z.infer<typeof voteSchema>;