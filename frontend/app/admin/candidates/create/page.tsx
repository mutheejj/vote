"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  ArrowLeft,
  Upload,
  UserCheck,
  FileText,
  Users,
  Check,
  X,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'
import { useNotifications } from '@/lib/hooks/useNotifications'
import { NotificationType } from '@/lib/enums'
import { createCandidateApplication, uploadCandidatePhoto } from '@/lib/api/candidates'
import { getElections } from '@/lib/api/elections'
import { getAllUsers } from '@/lib/api/admin'
import { VALIDATION_RULES } from '@/lib/constants'

const candidateSchema = z.object({
  userId: z.string().min(1, 'Please select a user'),
  positionId: z.string().min(1, 'Please select a position'),
  electionId: z.string().min(1, 'Please select an election'),
  manifesto: z
    .string()
    .max(VALIDATION_RULES.CANDIDATE.MANIFESTO.MAX_LENGTH,
      `Manifesto must be less than ${VALIDATION_RULES.CANDIDATE.MANIFESTO.MAX_LENGTH} characters`)
    .optional(),
  slogan: z
    .string()
    .max(VALIDATION_RULES.CANDIDATE.SLOGAN.MAX_LENGTH,
      `Slogan must be less than ${VALIDATION_RULES.CANDIDATE.SLOGAN.MAX_LENGTH} characters`)
    .optional(),
  runningMateId: z.string().optional(),
})

type CandidateFormData = z.infer<typeof candidateSchema>

export default function CreateCandidatePage() {
  const router = useRouter()
  const { user } = useAuth()
  const { addNotification } = useNotifications()
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [selectedElection, setSelectedElection] = useState<string>('')

  const form = useForm<CandidateFormData>({
    resolver: zodResolver(candidateSchema),
    defaultValues: {
      userId: '',
      positionId: '',
      electionId: '',
      manifesto: '',
      slogan: '',
      runningMateId: '',
    },
  })

  // Fetch elections
  const { data: electionsData, isLoading: loadingElections } = useQuery({
    queryKey: ['elections'],
    queryFn: async () => {
      const response = await getElections()
      // Handle paginated response - return the data array
      return response.data.data?.data || []
    }
  })

  // Fetch users (for candidate selection)
  const { data: usersData, isLoading: loadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await getAllUsers({ role: 'VOTER' })
      return response.data
    }
  })

  // Get positions for selected election
  const selectedElectionData = Array.isArray(electionsData) ? electionsData.find((e: { id: string }) => e.id === selectedElection) : null
  const positions = selectedElectionData?.positions || []

  // Create candidate mutation
  const createCandidateMutation = useMutation({
    mutationFn: async (data: CandidateFormData) => {
      const response = await createCandidateApplication({
        positionId: data.positionId,
        manifesto: data.manifesto,
        slogan: data.slogan,
        runningMateId: data.runningMateId || undefined,
      })
      return response.data
    },
    onSuccess: async (data) => {
      // Upload photo if selected
      if (selectedPhoto && data.data) {
        try {
          await uploadCandidatePhoto(data.data.id, selectedPhoto)
        } catch (error) {
          console.error('Photo upload failed:', error)
        }
      }

      addNotification({
        type: NotificationType.SUCCESS,
        title: 'Success',
        message: 'Candidate application created successfully',
      })
      router.push('/admin/candidates')
    },
    onError: (error: any) => {
      addNotification({
        type: NotificationType.ERROR,
        title: 'Error',
        message: error.response?.data?.message || 'Failed to create candidate application',
      })
    }
  })

  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        addNotification({
          type: NotificationType.ERROR,
          title: 'Error',
          message: 'Photo must be less than 5MB',
        })
        return
      }

      if (!file.type.startsWith('image/')) {
        addNotification({
          type: NotificationType.ERROR,
          title: 'Error',
          message: 'Please select a valid image file',
        })
        return
      }

      setSelectedPhoto(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const onSubmit = (data: CandidateFormData) => {
    createCandidateMutation.mutate(data)
  }

  if (loadingElections || loadingUsers) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading form data...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/candidates">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Candidates
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Candidate Application</h1>
          <p className="text-muted-foreground mt-2">
            Add a new candidate to an election position
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Candidate Information</CardTitle>
              <CardDescription>
                Fill in the details for the new candidate application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* User Selection */}
                  <FormField
                    control={form.control}
                    name="userId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select User</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a user to become a candidate" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(usersData as any)?.data?.map((user: any) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.firstName} {user.lastName} ({user.studentId})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Select the user who will become a candidate
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Election Selection */}
                  <FormField
                    control={form.control}
                    name="electionId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Election</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value)
                            setSelectedElection(value)
                            form.setValue('positionId', '') // Reset position when election changes
                          }}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an election" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.isArray(electionsData) && electionsData.map((election: any) => (
                              <SelectItem key={election.id} value={election.id}>
                                {election.title} - {election.status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choose the election for this candidacy
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Position Selection */}
                  <FormField
                    control={form.control}
                    name="positionId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Position</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={!selectedElection}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a position" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {positions.map((position: any) => (
                              <SelectItem key={position.id} value={position.id}>
                                {position.title} - {position.description}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {!selectedElection
                            ? 'Please select an election first'
                            : 'Choose the position this candidate is running for'
                          }
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Running Mate Selection */}
                  <FormField
                    control={form.control}
                    name="runningMateId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Running Mate (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a running mate (optional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">No running mate</SelectItem>
                            {(usersData as any)?.data?.map((user: any) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.firstName} {user.lastName} ({user.studentId})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Optional: Select a running mate for this candidate
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Slogan */}
                  <FormField
                    control={form.control}
                    name="slogan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Slogan</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter campaign slogan..."
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          A short, catchy phrase for the campaign (max {VALIDATION_RULES.CANDIDATE.SLOGAN.MAX_LENGTH} characters)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Manifesto */}
                  <FormField
                    control={form.control}
                    name="manifesto"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Manifesto</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter the candidate's manifesto and campaign promises..."
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Detailed campaign manifesto and promises (max {VALIDATION_RULES.CANDIDATE.MANIFESTO.MAX_LENGTH} characters)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Submit Button */}
                  <div className="flex justify-end space-x-4">
                    <Button type="button" variant="outline" asChild>
                      <Link href="/admin/candidates">Cancel</Link>
                    </Button>
                    <Button
                      type="submit"
                      disabled={createCandidateMutation.isPending}
                    >
                      {createCandidateMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <UserCheck className="mr-2 h-4 w-4" />
                          Create Candidate
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Photo Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Candidate Photo</CardTitle>
              <CardDescription>
                Upload a profile photo for the candidate
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={photoPreview || undefined} />
                  <AvatarFallback className="bg-gray-100">
                    <Upload className="h-8 w-8 text-gray-400" />
                  </AvatarFallback>
                </Avatar>

                <div className="flex flex-col space-y-2 w-full">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                    id="photo-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('photo-upload')?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {photoPreview ? 'Change Photo' : 'Upload Photo'}
                  </Button>
                  {selectedPhoto && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedPhoto(null)
                        setPhotoPreview(null)
                      }}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Remove Photo
                    </Button>
                  )}
                </div>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p>" Maximum file size: 5MB</p>
                <p>" Supported formats: JPG, PNG, GIF</p>
                <p>" Recommended: Square aspect ratio</p>
              </div>
            </CardContent>
          </Card>

          {/* Guidelines */}
          <Card>
            <CardHeader>
              <CardTitle>Creation Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">Verify User Eligibility</p>
                    <p className="text-muted-foreground">Ensure the selected user meets all candidacy requirements</p>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">Review Content</p>
                    <p className="text-muted-foreground">Check manifesto and slogan for appropriate content</p>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">Confirm Details</p>
                    <p className="text-muted-foreground">Double-check election and position selection</p>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <FileText className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">Auto-Approval</p>
                    <p className="text-muted-foreground">Admin-created candidates are automatically approved</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}