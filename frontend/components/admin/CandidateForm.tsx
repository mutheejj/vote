"use client"

import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  User,
  Upload,
  Save,
  X,
  Camera,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Download
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Candidate } from "@/lib/types"
import { CandidateStatus, CANDIDATE_STATUS_LABELS } from "@/lib/enums"
import { cn } from "@/lib/utils/cn"

const candidateSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters").max(50, "First name cannot exceed 50 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters").max(50, "Last name cannot exceed 50 characters"),
  email: z.string().email("Invalid email address"),
  studentId: z.string().min(1, "Student ID is required").regex(/^[A-Z]{2,4}\d{3}-\d{4}\/\d{4}$/, "Invalid student ID format (e.g., ABC123-1234/2023)"),
  phone: z.string().optional(),
  faculty: z.string().min(1, "Faculty is required"),
  department: z.string().min(1, "Department is required"),
  course: z.string().min(1, "Course is required"),
  yearOfStudy: z.number().min(1, "Year of study must be at least 1").max(6, "Year of study cannot exceed 6"),
  manifesto: z.string().min(50, "Manifesto must be at least 50 characters").max(5000, "Manifesto cannot exceed 5000 characters"),
  slogan: z.string().max(100, "Slogan cannot exceed 100 characters").optional(),
  status: z.nativeEnum(CandidateStatus).optional(),
  disqualificationReason: z.string().optional()
})

interface CandidateFormProps {
  candidate?: Candidate
  onSubmit: (data: any) => Promise<void>
  onStatusUpdate?: (candidateId: string, status: CandidateStatus, reason?: string) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
  isAdmin?: boolean
  className?: string
}

export function CandidateForm({
  candidate,
  onSubmit,
  onStatusUpdate,
  onCancel,
  isLoading = false,
  isAdmin = false,
  className
}: CandidateFormProps) {
  const [currentTab, setCurrentTab] = useState("basic")
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [manifestoFile, setManifestoFile] = useState<File | null>(null)
  const [statusAction, setStatusAction] = useState<{ action: CandidateStatus; reason: string } | null>(null)

  const form = useForm<z.infer<typeof candidateSchema>>({
    resolver: zodResolver(candidateSchema),
    defaultValues: {
      firstName: candidate?.firstName || "",
      lastName: candidate?.lastName || "",
      email: candidate?.user?.email || "",
      studentId: candidate?.user?.studentId || "",
      phone: candidate?.user?.phone || "",
      faculty: candidate?.faculty || "",
      department: candidate?.department || "",
      course: candidate?.course || "",
      yearOfStudy: candidate?.yearOfStudy || 1,
      manifesto: candidate?.manifesto || "",
      slogan: candidate?.slogan || "",
      status: candidate?.status || CandidateStatus.PENDING,
      disqualificationReason: candidate?.disqualifiedReason || ""
    }
  })

  const handleSubmit = async (data: z.infer<typeof candidateSchema>) => {
    try {
      const formData = new FormData()

      // Add form fields
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString())
        }
      })

      // Add files
      if (photoFile) {
        formData.append('photo', photoFile)
      }
      if (manifestoFile) {
        formData.append('manifesto', manifestoFile)
      }

      await onSubmit(formData)
    } catch (error) {
      console.error("Failed to save candidate:", error)
    }
  }

  const handleStatusUpdate = async (status: CandidateStatus) => {
    if (!candidate?.id || !onStatusUpdate) return

    try {
      await onStatusUpdate(candidate.id, status, statusAction?.reason)
      setStatusAction(null)
    } catch (error) {
      console.error("Failed to update candidate status:", error)
    }
  }

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert("Photo file size must be less than 5MB")
        return
      }
      if (!file.type.startsWith('image/')) {
        alert("Please select a valid image file")
        return
      }
      setPhotoFile(file)
    }
  }

  const handleManifestoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert("Manifesto file size must be less than 10MB")
        return
      }
      if (!['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
        alert("Please select a PDF or Word document")
        return
      }
      setManifestoFile(file)
    }
  }

  const getStatusVariant = (status: CandidateStatus) => {
    switch (status) {
      case CandidateStatus.APPROVED:
        return "success"
      case CandidateStatus.REJECTED:
      case CandidateStatus.DISQUALIFIED:
        return "destructive"
      case CandidateStatus.WITHDRAWN:
        return "secondary"
      default:
        return "outline"
    }
  }

  const getStatusIcon = (status: CandidateStatus) => {
    switch (status) {
      case CandidateStatus.APPROVED:
        return <CheckCircle className="h-4 w-4" />
      case CandidateStatus.REJECTED:
      case CandidateStatus.DISQUALIFIED:
        return <XCircle className="h-4 w-4" />
      case CandidateStatus.WITHDRAWN:
        return <AlertCircle className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {candidate ? "Edit Candidate" : "Create New Candidate"}
          </h2>
          <p className="text-gray-600">
            {candidate ? "Update candidate information and status" : "Register a new candidate application"}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {candidate && (
            <Badge variant={getStatusVariant(candidate.status)} className="flex items-center space-x-1">
              {getStatusIcon(candidate.status)}
              <span>{CANDIDATE_STATUS_LABELS[candidate.status]}</span>
            </Badge>
          )}
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <Tabs value={currentTab} onValueChange={setCurrentTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="academic">Academic</TabsTrigger>
              <TabsTrigger value="campaign">Campaign</TabsTrigger>
              {isAdmin && <TabsTrigger value="admin">Admin Actions</TabsTrigger>}
            </TabsList>

            <TabsContent value="basic" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    Basic candidate details and contact information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-6">
                    <div className="flex flex-col items-center space-y-2">
                      <Avatar className="h-24 w-24">
                        <AvatarImage
                          src={photoFile ? URL.createObjectURL(photoFile) : candidate?.photo}
                          alt="Candidate photo"
                        />
                        <AvatarFallback className="text-lg">
                          {form.watch("firstName")?.[0]}{form.watch("lastName")?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <Label htmlFor="photo-upload" className="cursor-pointer">
                        <div className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700">
                          <Camera className="h-4 w-4" />
                          <span>Upload Photo</span>
                        </div>
                        <Input
                          id="photo-upload"
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="sr-only"
                        />
                      </Label>
                    </div>

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter first name" {...field} />
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
                            <FormLabel>Last Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter last name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address *</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="Enter email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter phone number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="academic" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Academic Information</CardTitle>
                  <CardDescription>
                    Student academic details and qualifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="studentId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Student ID *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., ABC123-1234/2023" {...field} />
                          </FormControl>
                          <FormDescription>
                            Format: ABC123-1234/2023
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="yearOfStudy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Year of Study *</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select year" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {[1, 2, 3, 4, 5, 6].map((year) => (
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
                      name="faculty"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Faculty *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter faculty" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Department *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter department" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="course"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course/Program *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter course or program of study" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="campaign" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Information</CardTitle>
                  <CardDescription>
                    Campaign manifesto, vision, and experience
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="slogan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Slogan</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter a memorable campaign slogan" {...field} />
                        </FormControl>
                        <FormDescription>
                          A short, catchy phrase that represents your campaign
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />


                  <FormField
                    control={form.control}
                    name="manifesto"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Manifesto *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Write your detailed manifesto..."
                            className="h-40"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Your detailed campaign manifesto and policy positions
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />


                  <div className="border rounded-lg p-4">
                    <Label className="text-sm font-medium">Manifesto Document (Optional)</Label>
                    <div className="mt-2 flex items-center space-x-4">
                      <Label htmlFor="manifesto-upload" className="cursor-pointer">
                        <div className="flex items-center space-x-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
                          <FileText className="h-4 w-4" />
                          <span>Upload Document</span>
                        </div>
                        <Input
                          id="manifesto-upload"
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={handleManifestoChange}
                          className="sr-only"
                        />
                      </Label>
                      {manifestoFile && (
                        <div className="flex items-center space-x-2 text-sm text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span>{manifestoFile.name}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF or Word document, max 10MB
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {isAdmin && (
              <TabsContent value="admin" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Administrative Actions</CardTitle>
                    <CardDescription>
                      Review and manage candidate status
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {candidate && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <h4 className="font-medium">Current Status</h4>
                            <div className="flex items-center space-x-2 mt-1">
                              {getStatusIcon(candidate.status)}
                              <span>{CANDIDATE_STATUS_LABELS[candidate.status]}</span>
                            </div>
                          </div>
                          <Badge variant={getStatusVariant(candidate.status)}>
                            {CANDIDATE_STATUS_LABELS[candidate.status]}
                          </Badge>
                        </div>

                        {candidate.status === CandidateStatus.PENDING && onStatusUpdate && (
                          <div className="space-y-3">
                            <h4 className="font-medium">Review Actions</h4>
                            <div className="flex space-x-2">
                              <Button
                                type="button"
                                onClick={() => handleStatusUpdate(CandidateStatus.APPROVED)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve
                              </Button>
                              <Button
                                type="button"
                                variant="destructive"
                                onClick={() => setStatusAction({ action: CandidateStatus.REJECTED, reason: "" })}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        )}

                        {candidate.status === CandidateStatus.APPROVED && onStatusUpdate && (
                          <div className="space-y-3">
                            <h4 className="font-medium">Additional Actions</h4>
                            <Button
                              type="button"
                              variant="destructive"
                              onClick={() => setStatusAction({ action: CandidateStatus.DISQUALIFIED, reason: "" })}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Disqualify
                            </Button>
                          </div>
                        )}

                        {candidate.disqualifiedReason && (
                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              <strong>Reason:</strong> {candidate.disqualifiedReason}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>

          <div className="flex items-center justify-between pt-6 border-t">
            <div className="text-sm text-gray-600">
              {candidate ? "Last updated: " + new Date(candidate.updatedAt).toLocaleDateString() : "New candidate application"}
            </div>
            <div className="flex space-x-2">
              <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Upload className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {candidate ? "Update Candidate" : "Save Candidate"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Form>

      {/* Status Action Modal */}
      {statusAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">
              {statusAction.action === CandidateStatus.REJECTED ? "Reject Candidate" : "Disqualify Candidate"}
            </h3>
            <div className="space-y-4">
              <div>
                <Label>Reason *</Label>
                <Textarea
                  placeholder="Provide a clear reason for this action..."
                  value={statusAction.reason}
                  onChange={(e) => setStatusAction({ ...statusAction, reason: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setStatusAction(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleStatusUpdate(statusAction.action)}
                  disabled={!statusAction.reason.trim()}
                  className="flex-1"
                >
                  Confirm
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CandidateForm