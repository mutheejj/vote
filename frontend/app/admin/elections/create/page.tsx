"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { useElections } from '@/lib/hooks/useElections'
import { useNotificationStore } from '@/lib/stores/notificationStore'
import { cn } from '@/lib/utils/cn'
import {
  Calendar,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  AlertCircle,
  Users,
  Settings,
  Shield,
  FileText,
  Clock,
  GripVertical,
  Info,
  CheckCircle2,
} from 'lucide-react'
import Link from 'next/link'
import {
  ElectionType,
  ELECTION_TYPE_LABELS,
  UNIVERSITY_FACULTIES,
  YEAR_OF_STUDY_OPTIONS,
} from '@/lib/enums'
import { CreateElectionData, CreatePositionData } from '@/lib/types'
import { getPositionTemplates, hasPositionTemplates } from '@/lib/config/positionTemplates'

// Validation Schema
const positionSchema = z.object({
  name: z.string().min(2, 'Position name must be at least 2 characters').max(100, 'Position name must not exceed 100 characters'),
  description: z.string().optional(),
  order: z.number().min(1, 'Order must be at least 1').max(100, 'Order must not exceed 100'),
  maxSelections: z.number().min(1, 'Max selections must be at least 1').max(10, 'Max selections must not exceed 10'),
  minSelections: z.number().min(0, 'Min selections cannot be negative').max(10, 'Min selections must not exceed 10'),
}).refine((data) => data.minSelections <= data.maxSelections, {
  message: "Min selections cannot exceed max selections",
  path: ["minSelections"],
})

const electionSchema = z.object({
  title: z.string()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title must not exceed 200 characters'),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must not exceed 2000 characters'),
  type: z.nativeEnum(ElectionType),
  startDate: z.string().refine((date) => {
    const startDate = new Date(date)
    const minStartDate = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
    return startDate > minStartDate
  }, 'Start date must be at least 1 hour from now'),
  endDate: z.string(),
  registrationStart: z.string().optional(),
  registrationEnd: z.string().optional(),

  // Eligibility
  eligibleFaculties: z.array(z.string()).optional(),
  eligibleDepartments: z.array(z.string()).optional(),
  eligibleCourses: z.array(z.string()).optional(),
  eligibleYears: z.array(z.number()).optional(),
  minVoterAge: z.number().min(16).max(100).optional(),
  maxVoterAge: z.number().min(16).max(100).optional(),

  // Voting Rules
  maxVotesPerPosition: z.number().min(1).max(10).default(1),
  allowAbstain: z.boolean().default(true),
  requireAllPositions: z.boolean().default(false),
  showLiveResults: z.boolean().default(false),

  // Security
  requireTwoFactor: z.boolean().default(false),
  encryptVotes: z.boolean().default(true),
  anonymousVoting: z.boolean().default(true),

  // Positions
  positions: z.array(positionSchema).min(1, 'At least one position is required').max(20, 'Maximum 20 positions allowed'),

  coverImage: z.string().optional(),
  rules: z.any().optional(),
}).refine((data) => {
  const startDate = new Date(data.startDate)
  const endDate = new Date(data.endDate)
  const minDuration = 2 * 60 * 60 * 1000 // 2 hours
  return endDate.getTime() - startDate.getTime() >= minDuration
}, {
  message: "Election must run for at least 2 hours",
  path: ["endDate"],
}).refine((data) => {
  const startDate = new Date(data.startDate)
  const endDate = new Date(data.endDate)
  return endDate > startDate
}, {
  message: "End date must be after start date",
  path: ["endDate"],
})

type ElectionFormValues = z.infer<typeof electionSchema>

export default function CreateElectionPage() {
  const router = useRouter()
  const { createNewElection } = useElections({ autoFetch: false })
  const { toast } = useNotificationStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentTab, setCurrentTab] = useState('basic')

  const form = useForm<ElectionFormValues>({
    resolver: zodResolver(electionSchema),
    defaultValues: {
      title: '',
      description: '',
      type: ElectionType.PRESIDENTIAL,
      startDate: '',
      endDate: '',
      registrationStart: '',
      registrationEnd: '',
      eligibleFaculties: [],
      eligibleDepartments: [],
      eligibleCourses: [],
      eligibleYears: [],
      maxVotesPerPosition: 1,
      allowAbstain: true,
      requireAllPositions: false,
      showLiveResults: false,
      requireTwoFactor: false,
      encryptVotes: true,
      anonymousVoting: true,
      positions: [
        {
          name: '',
          description: '',
          order: 1,
          maxSelections: 1,
          minSelections: 1,
        }
      ],
    },
  })

  const { fields: positionFields, append: appendPosition, remove: removePosition, move: movePosition } = useFieldArray({
    control: form.control,
    name: 'positions',
  })

  const watchedElectionType = form.watch('type')

  const onSubmit = async (data: ElectionFormValues) => {
    try {
      setIsSubmitting(true)

      // Transform data to match backend expectations
      const electionData: CreateElectionData = {
        title: data.title,
        description: data.description,
        type: data.type,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        registrationStart: data.registrationStart ? new Date(data.registrationStart) : undefined,
        registrationEnd: data.registrationEnd ? new Date(data.registrationEnd) : undefined,
        eligibleFaculties: data.eligibleFaculties?.length ? data.eligibleFaculties : undefined,
        eligibleDepartments: data.eligibleDepartments?.length ? data.eligibleDepartments : undefined,
        eligibleCourses: data.eligibleCourses?.length ? data.eligibleCourses : undefined,
        eligibleYears: data.eligibleYears?.length ? data.eligibleYears : undefined,
        minVoterAge: data.minVoterAge,
        maxVoterAge: data.maxVoterAge,
        maxVotesPerPosition: data.maxVotesPerPosition,
        allowAbstain: data.allowAbstain,
        requireAllPositions: data.requireAllPositions,
        showLiveResults: data.showLiveResults,
        requireTwoFactor: data.requireTwoFactor,
        encryptVotes: data.encryptVotes,
        anonymousVoting: data.anonymousVoting,
        coverImage: data.coverImage,
        rules: data.rules,
        positions: data.positions.map(pos => ({
          name: pos.name,
          description: pos.description,
          order: pos.order,
          maxSelections: pos.maxSelections,
          minSelections: pos.minSelections,
        })),
      }

      // Create election
      const newElection = await createNewElection(electionData)

      // Show success toast with redirect information
      toast.success(
        'Election Created Successfully',
        `"${newElection.title}" has been created. Redirecting...`
      )

      // Redirect to the newly created election page after a brief delay
      setTimeout(() => {
        router.push(`/admin/elections/${newElection.id}`)
      }, 1500)
    } catch (error: any) {
      console.error('Failed to create election:', error)
      // Error toast is already shown by the hook
    } finally {
      // Always reset submitting state after a delay (to allow redirect to happen)
      setTimeout(() => {
        setIsSubmitting(false)
      }, 2000)
    }
  }

  const addNewPosition = () => {
    const newOrder = positionFields.length + 1
    appendPosition({
      name: '',
      description: '',
      order: newOrder,
      maxSelections: 1,
      minSelections: 1,
    })
  }

  const formatDateTimeLocal = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  const getMinStartDate = () => {
    const date = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
    return formatDateTimeLocal(date)
  }

  const getMinEndDate = () => {
    const startDate = form.watch('startDate')
    if (startDate) {
      const date = new Date(startDate)
      date.setHours(date.getHours() + 2) // Minimum 2 hours after start
      return formatDateTimeLocal(date)
    }
    return ''
  }

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link href="/admin/elections">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create New Election</h1>
            <p className="text-muted-foreground mt-1">
              Set up a new election for university student leaders
            </p>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className={cn(
              "flex items-center space-x-2",
              currentTab === 'basic' && "text-primary"
            )}>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center border-2",
                currentTab === 'basic' ? "border-primary bg-primary text-primary-foreground" : "border-muted"
              )}>
                <FileText className="h-4 w-4" />
              </div>
              <span className="font-medium">Basic Info</span>
            </div>
            <Separator className="flex-1 mx-4" />
            <div className={cn(
              "flex items-center space-x-2",
              currentTab === 'eligibility' && "text-primary"
            )}>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center border-2",
                currentTab === 'eligibility' ? "border-primary bg-primary text-primary-foreground" : "border-muted"
              )}>
                <Users className="h-4 w-4" />
              </div>
              <span className="font-medium">Eligibility</span>
            </div>
            <Separator className="flex-1 mx-4" />
            <div className={cn(
              "flex items-center space-x-2",
              currentTab === 'settings' && "text-primary"
            )}>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center border-2",
                currentTab === 'settings' ? "border-primary bg-primary text-primary-foreground" : "border-muted"
              )}>
                <Settings className="h-4 w-4" />
              </div>
              <span className="font-medium">Settings</span>
            </div>
            <Separator className="flex-1 mx-4" />
            <div className={cn(
              "flex items-center space-x-2",
              currentTab === 'positions' && "text-primary"
            )}>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center border-2",
                currentTab === 'positions' ? "border-primary bg-primary text-primary-foreground" : "border-muted"
              )}>
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <span className="font-medium">Positions</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs value={currentTab} onValueChange={setCurrentTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="eligibility">Eligibility</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="positions">Positions</TabsTrigger>
            </TabsList>

            {/* Basic Information Tab */}
            <TabsContent value="basic" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Election Details</CardTitle>
                  <CardDescription>
                    Provide basic information about the election
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Election Title *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Student Union Presidential Elections 2024"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          A clear, descriptive title for the election (5-200 characters)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the purpose and scope of this election..."
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Detailed description of the election (10-2000 characters)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Election Type *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select election type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(ELECTION_TYPE_LABELS).map(([key, label]) => (
                              <SelectItem key={key} value={key}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          The type of election being conducted
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5" />
                    <span>Election Schedule</span>
                  </CardTitle>
                  <CardDescription>
                    Set the dates and times for the election
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Scheduling Requirements</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
                        <li>Start date must be at least 1 hour from now</li>
                        <li>Election must run for minimum 2 hours</li>
                        <li>Registration period is optional but recommended</li>
                      </ul>
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date & Time *</FormLabel>
                          <FormControl>
                            <Input
                              type="datetime-local"
                              min={getMinStartDate()}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date & Time *</FormLabel>
                          <FormControl>
                            <Input
                              type="datetime-local"
                              min={getMinEndDate()}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Candidate Registration Period (Optional)</h4>
                    <p className="text-sm text-muted-foreground">
                      Set a specific period for candidate applications
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="registrationStart"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Registration Start</FormLabel>
                          <FormControl>
                            <Input
                              type="datetime-local"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="registrationEnd"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Registration End</FormLabel>
                          <FormControl>
                            <Input
                              type="datetime-local"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Eligibility Tab */}
            <TabsContent value="eligibility" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Voter Eligibility Criteria</span>
                  </CardTitle>
                  <CardDescription>
                    Define who can vote in this election. Leave empty to allow all students.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Eligibility Rules</AlertTitle>
                    <AlertDescription>
                      Voters must meet ALL specified criteria to be eligible. If no criteria are selected,
                      all registered students will be eligible to vote.
                    </AlertDescription>
                  </Alert>

                  <FormField
                    control={form.control}
                    name="eligibleFaculties"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Eligible Faculties</FormLabel>
                        <FormDescription>
                          Select which faculties are eligible to vote
                        </FormDescription>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                          {UNIVERSITY_FACULTIES.map((faculty) => (
                            <div key={faculty} className="flex items-center space-x-2">
                              <Checkbox
                                checked={field.value?.includes(faculty)}
                                onCheckedChange={(checked) => {
                                  const current = field.value || []
                                  if (checked) {
                                    field.onChange([...current, faculty])
                                  } else {
                                    field.onChange(current.filter(f => f !== faculty))
                                  }
                                }}
                              />
                              <label className="text-sm cursor-pointer">
                                {faculty}
                              </label>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  <FormField
                    control={form.control}
                    name="eligibleYears"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Eligible Years of Study</FormLabel>
                        <FormDescription>
                          Select which years of study are eligible to vote
                        </FormDescription>
                        <div className="flex flex-wrap gap-3 mt-2">
                          {YEAR_OF_STUDY_OPTIONS.map((year) => (
                            <div key={year} className="flex items-center space-x-2">
                              <Checkbox
                                checked={field.value?.includes(year)}
                                onCheckedChange={(checked) => {
                                  const current = field.value || []
                                  if (checked) {
                                    field.onChange([...current, year])
                                  } else {
                                    field.onChange(current.filter(y => y !== year))
                                  }
                                }}
                              />
                              <label className="text-sm cursor-pointer">
                                Year {year}
                              </label>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="minVoterAge"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimum Voter Age</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={16}
                              max={100}
                              placeholder="e.g., 18"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormDescription>
                            Minimum age required to vote
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="maxVoterAge"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maximum Voter Age</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={16}
                              max={100}
                              placeholder="e.g., 30"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormDescription>
                            Maximum age allowed to vote
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>Voting Rules</span>
                  </CardTitle>
                  <CardDescription>
                    Configure how voting will work for this election
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="maxVotesPerPosition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Votes Per Position</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            max={10}
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Maximum number of candidates a voter can select for each position
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="allowAbstain"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Allow Abstain Option
                          </FormLabel>
                          <FormDescription>
                            Voters can choose to abstain from voting for a position
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="requireAllPositions"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Require All Positions
                          </FormLabel>
                          <FormDescription>
                            Voters must vote for all positions to submit their ballot
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="showLiveResults"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Show Live Results
                          </FormLabel>
                          <FormDescription>
                            Display real-time voting results during the election
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>Security Settings</span>
                  </CardTitle>
                  <CardDescription>
                    Configure security measures for the election
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="requireTwoFactor"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Require Two-Factor Authentication
                          </FormLabel>
                          <FormDescription>
                            Voters must use 2FA to cast their vote
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="encryptVotes"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-green-50/50">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Encrypt Votes
                          </FormLabel>
                          <FormDescription>
                            All votes are encrypted for maximum security (Recommended)
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="anonymousVoting"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-green-50/50">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Anonymous Voting
                          </FormLabel>
                          <FormDescription>
                            Voter identity is not linked to their vote (Recommended)
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Positions Tab */}
            <TabsContent value="positions" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Election Positions</CardTitle>
                      <CardDescription>
                        Add positions that candidates will run for (1-20 positions)
                      </CardDescription>
                    </div>
                    <Button
                      type="button"
                      onClick={addNewPosition}
                      disabled={positionFields.length >= 20}
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Position
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {positionFields.length === 0 ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>No Positions Added</AlertTitle>
                      <AlertDescription>
                        Click "Add Position" to create positions for this election.
                        You must add at least one position.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <ScrollArea className="h-[500px] pr-4">
                      <div className="space-y-4">
                        {positionFields.map((field, index) => (
                          <Card key={field.id} className="border-2">
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className="cursor-move">
                                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                                  </div>
                                  <Badge variant="outline">Position {index + 1}</Badge>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removePosition(index)}
                                  disabled={positionFields.length === 1}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <FormField
                                control={form.control}
                                name={`positions.${index}.name`}
                                render={({ field }) => {
                                  const showDropdown = hasPositionTemplates(watchedElectionType);

                                  return (
                                    <FormItem>
                                      <FormLabel>Position Name *</FormLabel>
                                      {showDropdown ? (
                                        <Select
                                          onValueChange={(value) => {
                                            if (value === '__custom__') {
                                              field.onChange('');
                                            } else {
                                              field.onChange(value);
                                              const template = getPositionTemplates(watchedElectionType).find(t => t.name === value);
                                              if (template) {
                                                form.setValue(`positions.${index}.description`, template.description);
                                                form.setValue(`positions.${index}.maxSelections`, template.maxSelections);
                                                form.setValue(`positions.${index}.minSelections`, 1);
                                                form.setValue(`positions.${index}.order`, template.order);
                                              }
                                            }
                                          }}
                                          value={field.value || ''}
                                        >
                                          <FormControl>
                                            <SelectTrigger>
                                              <SelectValue placeholder="Select position from template" />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            {getPositionTemplates(watchedElectionType).map((template) => (
                                              <SelectItem key={template.name} value={template.name}>
                                                {template.name}
                                              </SelectItem>
                                            ))}
                                            <SelectItem value="__custom__">Custom Position...</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      ) : (
                                        <FormControl>
                                          <Input
                                            placeholder="e.g., President, Vice President, Secretary"
                                            {...field}
                                          />
                                        </FormControl>
                                      )}
                                      <FormMessage />
                                    </FormItem>
                                  );
                                }}
                              />

                              <FormField
                                control={form.control}
                                name={`positions.${index}.description`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Description (Optional)</FormLabel>
                                    <FormControl>
                                      <Textarea
                                        placeholder="Describe the responsibilities of this position..."
                                        className="min-h-[80px]"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <div className="grid grid-cols-3 gap-3">
                                <FormField
                                  control={form.control}
                                  name={`positions.${index}.order`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Order *</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          min={1}
                                          max={100}
                                          {...field}
                                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control}
                                  name={`positions.${index}.minSelections`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Min *</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          min={0}
                                          max={10}
                                          {...field}
                                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control}
                                  name={`positions.${index}.maxSelections`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Max *</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          min={1}
                                          max={10}
                                          {...field}
                                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Form Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>

                <div className="flex items-center space-x-3">
                  {currentTab !== 'positions' && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const tabs = ['basic', 'eligibility', 'settings', 'positions']
                        const currentIndex = tabs.indexOf(currentTab)
                        if (currentIndex < tabs.length - 1) {
                          setCurrentTab(tabs[currentIndex + 1])
                        }
                      }}
                    >
                      Next Step
                    </Button>
                  )}

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="min-w-[150px]"
                  >
                    {isSubmitting ? (
                      <>
                        <LoadingSpinner className="mr-2" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Create Election
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  )
}