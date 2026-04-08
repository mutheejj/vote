"use client"

import React, { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Settings,
  Users,
  Shield,
  AlertTriangle,
  Info,
  Eye,
  Upload,
  X,
  GripVertical,
  MapPin,
  Globe,
  Lock
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useAuth } from "@/lib/hooks/useAuth"
import { useNotifications } from "@/lib/hooks/useNotifications"
import { getElectionById, updateElection } from "@/lib/api/elections"
import { Election, CreateElectionData, UpdateElectionData } from "@/lib/types"
import { ElectionType, ElectionStatus, ELECTION_TYPE_LABELS, UNIVERSITY_FACULTIES, YEAR_OF_STUDY_OPTIONS } from "@/lib/enums"
import { cn } from "@/lib/utils/cn"
import { format } from "date-fns"

// Validation schema
const electionFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(200, "Title must be less than 200 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").max(2000, "Description must be less than 2000 characters"),
  type: z.nativeEnum(ElectionType),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  registrationStart: z.string().optional(),
  registrationEnd: z.string().optional(),
  eligibleFaculties: z.array(z.string()).optional(),
  eligibleDepartments: z.array(z.string()).optional(),
  eligibleCourses: z.array(z.string()).optional(),
  eligibleYears: z.array(z.number()).optional(),
  minVoterAge: z.number().min(16).max(100).optional(),
  maxVoterAge: z.number().min(16).max(100).optional(),
  maxVotesPerPosition: z.number().min(1).max(10).optional(),
  allowAbstain: z.boolean().default(false),
  requireAllPositions: z.boolean().default(false),
  showLiveResults: z.boolean().default(false),
  requireTwoFactor: z.boolean().default(false),
  encryptVotes: z.boolean().default(true),
  anonymousVoting: z.boolean().default(true),
  positions: z.array(z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Position name is required"),
    description: z.string().optional(),
    order: z.number().min(1),
    maxSelections: z.number().min(1),
    minSelections: z.number().min(0),
  })).min(1, "At least one position is required"),
}).refine((data) => {
  const start = new Date(data.startDate)
  const end = new Date(data.endDate)
  return end > start
}, {
  message: "End date must be after start date",
  path: ["endDate"],
}).refine((data) => {
  if (data.registrationStart && data.registrationEnd) {
    const regStart = new Date(data.registrationStart)
    const regEnd = new Date(data.registrationEnd)
    return regEnd > regStart
  }
  return true
}, {
  message: "Registration end date must be after registration start date",
  path: ["registrationEnd"],
}).refine((data) => {
  if (data.minVoterAge && data.maxVoterAge) {
    return data.maxVoterAge > data.minVoterAge
  }
  return true
}, {
  message: "Maximum age must be greater than minimum age",
  path: ["maxVoterAge"],
})

type ElectionFormData = z.infer<typeof electionFormSchema>

export default function AdminElectionEditPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useNotifications()

  const electionId = params.id as string

  // State
  const [election, setElection] = useState<Election | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Form
  const form = useForm<ElectionFormData>({
    resolver: zodResolver(electionFormSchema),
    defaultValues: {
      allowAbstain: false,
      requireAllPositions: false,
      showLiveResults: false,
      requireTwoFactor: false,
      encryptVotes: true,
      anonymousVoting: true,
      positions: [],
    },
  })

  const { fields: positionFields, append: appendPosition, remove: removePosition, move: movePosition } = useFieldArray({
    control: form.control,
    name: "positions",
  })

  // Load election data
  useEffect(() => {
    loadElectionData()
  }, [electionId])

  // Track form changes
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      // Only set unsaved changes if a field was actually modified by the user
      if (name && type === 'change') {
        console.log("Form field changed:", name, "Type:", type)
        setHasUnsavedChanges(true)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const loadElectionData = async () => {
    setIsLoading(true)
    try {
      const response = await getElectionById(electionId)
      if (response.data.success && response.data.data) {
        const electionData = response.data.data
        setElection(electionData)

        // Populate form with election data
        const formData: ElectionFormData = {
          title: electionData.title,
          description: electionData.description,
          type: electionData.type,
          startDate: format(new Date(electionData.startDate), "yyyy-MM-dd'T'HH:mm"),
          endDate: format(new Date(electionData.endDate), "yyyy-MM-dd'T'HH:mm"),
          registrationStart: electionData.registrationStart ? format(new Date(electionData.registrationStart), "yyyy-MM-dd'T'HH:mm") : undefined,
          registrationEnd: electionData.registrationEnd ? format(new Date(electionData.registrationEnd), "yyyy-MM-dd'T'HH:mm") : undefined,
          eligibleFaculties: electionData.eligibleFaculties || [],
          eligibleDepartments: electionData.eligibleDepartments || [],
          eligibleCourses: electionData.eligibleCourses || [],
          eligibleYears: electionData.eligibleYears || [],
          minVoterAge: electionData.minVoterAge,
          maxVoterAge: electionData.maxVoterAge,
          maxVotesPerPosition: electionData.maxVotesPerPosition,
          allowAbstain: electionData.allowAbstain || false,
          requireAllPositions: electionData.requireAllPositions || false,
          showLiveResults: electionData.showLiveResults || false,
          requireTwoFactor: electionData.requireTwoFactor || false,
          encryptVotes: electionData.encryptVotes !== false,
          anonymousVoting: electionData.anonymousVoting !== false,
          positions: electionData.positions?.map((pos, index) => ({
            id: pos.id,
            name: pos.name,
            description: pos.description || "",
            order: pos.order || index + 1,
            maxSelections: pos.maxSelections,
            minSelections: pos.minSelections,
          })) || [],
        }

        form.reset(formData)
        setHasUnsavedChanges(false)
      }
    } catch (error) {
      toast.error("Failed to load election data")
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: ElectionFormData) => {
    console.log("Form submission started", data)
    setIsSaving(true)
    try {
      const updateData: UpdateElectionData = {
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
        positions: data.positions,
      }

      console.log("Sending update request with data:", updateData)
      const response = await updateElection(electionId, updateData)
      console.log("Update response:", response)

      if (response.data.success) {
        toast.success("Election updated successfully")
        setHasUnsavedChanges(false)
        router.push(`/admin/elections/${electionId}`)
      } else {
        toast.error(response.data.error || response.data.message || "Failed to update election")
      }
    } catch (error: any) {
      console.error("Failed to update election:", error)
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || "Failed to update election"
      toast.error(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  const addPosition = () => {
    appendPosition({
      name: "",
      description: "",
      order: positionFields.length + 1,
      maxSelections: 1,
      minSelections: 1,
    })
  }

  const canEdit = () => {
    return election?.status === ElectionStatus.DRAFT || election?.status === ElectionStatus.SCHEDULED
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-96 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    )
  }

  if (!election) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Election Not Found</h3>
            <p className="text-gray-600 mb-4">The election you're trying to edit doesn't exist or has been removed.</p>
            <Button asChild>
              <Link href="/admin/elections">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Elections
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!canEdit()) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Election Cannot Be Edited</h3>
            <p className="text-gray-600 mb-4">
              This election is currently {election.status.toLowerCase()} and cannot be modified.
            </p>
            <div className="flex justify-center space-x-2">
              <Button variant="outline" asChild>
                <Link href="/admin/elections">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Elections
                </Link>
              </Button>
              <Button asChild>
                <Link href={`/admin/elections/${electionId}`}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Election
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/admin/elections/${electionId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Election
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Election</h1>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-sm text-gray-600">{election.title}</span>
              <Badge variant="outline">{ELECTION_TYPE_LABELS[election.type]}</Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/admin/elections/${electionId}`}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Link>
          </Button>
          <Button
            size="sm"
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSaving || !hasUnsavedChanges}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Warning for unsaved changes */}
      {hasUnsavedChanges && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <span className="text-sm text-orange-800">You have unsaved changes</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="basic" className="space-y-6">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              <TabsTrigger value="eligibility">Eligibility</TabsTrigger>
              <TabsTrigger value="positions">Positions</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>
                    Configure the fundamental details of your election
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Election Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter election title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Election Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select election type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.values(ElectionType).map((type) => (
                                <SelectItem key={type} value={type}>
                                  {ELECTION_TYPE_LABELS[type]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div></div>

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe the election purpose and details"
                              className="min-h-24"
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

              <Card>
                <CardHeader>
                  <CardTitle>Voting Settings</CardTitle>
                  <CardDescription>
                    Configure how voting will work for this election
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="allowAbstain"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Allow Abstain</FormLabel>
                            <FormDescription>
                              Voters can choose to abstain from voting for any position
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="requireAllPositions"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Require All Positions</FormLabel>
                            <FormDescription>
                              Voters must vote for all positions to submit ballot
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="showLiveResults"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Show Live Results</FormLabel>
                            <FormDescription>
                              Display real-time voting results during the election
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="maxVotesPerPosition"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Votes Per Position</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              max={10}
                              placeholder="1"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormDescription>
                            Maximum number of candidates a voter can select per position
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>
                    Configure security and privacy options
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="requireTwoFactor"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Require Two-Factor Auth</FormLabel>
                            <FormDescription>
                              Voters must have 2FA enabled to participate
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="encryptVotes"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Encrypt Votes</FormLabel>
                            <FormDescription>
                              Votes are encrypted before storage (recommended)
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="anonymousVoting"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 md:col-span-2">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Anonymous Voting</FormLabel>
                            <FormDescription>
                              Voter identity is not linked to vote choices (recommended)
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Voting Schedule</CardTitle>
                  <CardDescription>
                    Set when voting will be available
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Voting Start Date & Time</FormLabel>
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
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Voting End Date & Time</FormLabel>
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

              <Card>
                <CardHeader>
                  <CardTitle>Registration Schedule</CardTitle>
                  <CardDescription>
                    Set when candidate registration is available (optional)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="registrationStart"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Registration Start Date & Time</FormLabel>
                          <FormControl>
                            <Input
                              type="datetime-local"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            When candidates can start registering
                          </FormDescription>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="registrationEnd"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Registration End Date & Time</FormLabel>
                          <FormControl>
                            <Input
                              type="datetime-local"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            When candidate registration closes
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="eligibility" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Voter Eligibility</CardTitle>
                  <CardDescription>
                    Define who can participate in this election
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="eligibleFaculties"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Eligible Faculties</FormLabel>
                          <FormDescription>
                            Leave empty to include all faculties
                          </FormDescription>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {UNIVERSITY_FACULTIES.map((faculty) => (
                              <FormField
                                key={faculty}
                                control={form.control}
                                name="eligibleFaculties"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={faculty}
                                      className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(faculty)}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([...(field.value || []), faculty])
                                              : field.onChange(
                                                  field.value?.filter(
                                                    (value) => value !== faculty
                                                  )
                                                )
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="text-sm font-normal">
                                        {faculty}
                                      </FormLabel>
                                    </FormItem>
                                  )
                                }}
                              />
                            ))}
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="eligibleYears"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Eligible Years of Study</FormLabel>
                          <FormDescription>
                            Leave empty to include all years
                          </FormDescription>
                          <div className="space-y-2">
                            {YEAR_OF_STUDY_OPTIONS.map((year) => (
                              <FormField
                                key={year}
                                control={form.control}
                                name="eligibleYears"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={year}
                                      className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(year)}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([...(field.value || []), year])
                                              : field.onChange(
                                                  field.value?.filter(
                                                    (value) => value !== year
                                                  )
                                                )
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="text-sm font-normal">
                                        Year {year}
                                      </FormLabel>
                                    </FormItem>
                                  )
                                }}
                              />
                            ))}
                          </div>
                        </FormItem>
                      )}
                    />

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
                              placeholder="18"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormDescription>
                            Minimum age requirement for voters
                          </FormDescription>
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
                              placeholder="65"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormDescription>
                            Maximum age requirement for voters
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="positions" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Election Positions</CardTitle>
                      <CardDescription>
                        Configure the positions voters will elect candidates for
                      </CardDescription>
                    </div>
                    <Button type="button" onClick={addPosition} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Position
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {positionFields.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Positions</h3>
                      <p className="text-gray-600 mb-4">Add positions that candidates will run for</p>
                      <Button type="button" onClick={addPosition}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Position
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {positionFields.map((field, index) => (
                        <Card key={field.id} className="border border-gray-200">
                          <CardContent className="p-4">
                            <div className="flex items-start space-x-4">
                              <div className="flex flex-col items-center space-y-2">
                                <GripVertical className="h-4 w-4 text-gray-400" />
                                <Badge variant="outline">{index + 1}</Badge>
                              </div>

                              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField
                                  control={form.control}
                                  name={`positions.${index}.name`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Position Name</FormLabel>
                                      <FormControl>
                                        <Input placeholder="e.g., President" {...field} />
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
                                      <FormLabel>Max Selections</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          min={1}
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
                                      <FormLabel>Min Selections</FormLabel>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          min={0}
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
                                  name={`positions.${index}.description`}
                                  render={({ field }) => (
                                    <FormItem className="md:col-span-3">
                                      <FormLabel>Description (Optional)</FormLabel>
                                      <FormControl>
                                        <Textarea
                                          placeholder="Position description..."
                                          {...field}
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              </div>

                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removePosition(index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      </Form>
    </div>
  )
}