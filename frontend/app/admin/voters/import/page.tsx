"use client"

import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { useNotificationStore } from '@/lib/stores/notificationStore'
import { cn } from '@/lib/utils/cn'
import {
  Upload,
  Download,
  FileText,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Info,
  FileSpreadsheet,
  Users,
  Mail,
  Shield,
  AlertTriangle,
  Eye,
} from 'lucide-react'
import Link from 'next/link'
import { API_CONFIG } from '@/lib/constants'
import { UNIVERSITY_FACULTIES } from '@/lib/enums'

interface ImportResult {
  totalRecords: number
  successfulImports: number
  failedImports: number
  errors: Array<{
    row: number
    field?: string
    message: string
  }>
  warnings: Array<{
    row: number
    message: string
  }>
}

interface VoterRecord {
  studentId: string
  email: string
  firstName: string
  lastName: string
  middleName?: string
  phone?: string
  faculty: string
  department: string
  course: string
  yearOfStudy: number
  admissionYear: number
  status?: 'valid' | 'error' | 'warning'
  errorMessage?: string
}

export default function VoterImportPage() {
  const router = useRouter()
  const { toast } = useNotificationStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [format, setFormat] = useState<'csv' | 'xlsx'>('csv')
  const [overwriteExisting, setOverwriteExisting] = useState(false)
  const [sendWelcomeEmails, setSendWelcomeEmails] = useState(true)
  const [defaultPassword, setDefaultPassword] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [previewData, setPreviewData] = useState<VoterRecord[]>([])
  const [importResult, setImportResult] = useState<ImportResult | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // Validate file type
    const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase()
    if (fileExtension !== 'csv' && fileExtension !== 'xlsx') {
      toast.error('Invalid File', 'Please select a CSV or XLSX file')
      return
    }

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('File Too Large', 'File size must be less than 10MB')
      return
    }

    setFile(selectedFile)
    setFormat(fileExtension as 'csv' | 'xlsx')
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const droppedFile = e.dataTransfer.files[0]
    if (!droppedFile) return

    // Validate file type
    const fileExtension = droppedFile.name.split('.').pop()?.toLowerCase()
    if (fileExtension !== 'csv' && fileExtension !== 'xlsx') {
      toast.error('Invalid File', 'Please select a CSV or XLSX file')
      return
    }

    if (droppedFile.size > 10 * 1024 * 1024) {
      toast.error('File Too Large', 'File size must be less than 10MB')
      return
    }

    setFile(droppedFile)
    setFormat(fileExtension as 'csv' | 'xlsx')
  }

  const validateRecord = (record: any, rowIndex: number): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []

    // Required fields validation
    if (!record.studentId) errors.push('Student ID is required')
    if (!record.email) errors.push('Email is required')
    if (!record.firstName) errors.push('First name is required')
    if (!record.lastName) errors.push('Last name is required')
    if (!record.faculty) errors.push('Faculty is required')
    if (!record.department) errors.push('Department is required')
    if (!record.course) errors.push('Course is required')
    if (!record.yearOfStudy) errors.push('Year of study is required')
    if (!record.admissionYear) errors.push('Admission year is required')

    // Format validation
    const studentIdRegex = /^[A-Z]{2,4}\d{3}-\d{4}\/\d{4}$/
    if (record.studentId && !studentIdRegex.test(record.studentId.toUpperCase())) {
      errors.push('Invalid student ID format. Expected: ABC123-1234/2023')
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (record.email && !emailRegex.test(record.email)) {
      errors.push('Invalid email format')
    }

    if (record.phone) {
      const phoneRegex = /^(\+254|0)[17]\d{8}$/
      if (!phoneRegex.test(record.phone)) {
        errors.push('Invalid phone format. Use +254712345678 or 0712345678')
      }
    }

    // Faculty validation
    if (record.faculty && !UNIVERSITY_FACULTIES.includes(record.faculty)) {
      errors.push('Invalid faculty. Must be one of the recognized faculties')
    }

    // Year of study validation
    const year = parseInt(record.yearOfStudy)
    if (isNaN(year) || year < 1 || year > 6) {
      errors.push('Year of study must be between 1 and 6')
    }

    // Admission year validation
    const admYear = parseInt(record.admissionYear)
    const currentYear = new Date().getFullYear()
    if (isNaN(admYear) || admYear < 2000 || admYear > currentYear) {
      errors.push(`Admission year must be between 2000 and ${currentYear}`)
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  const parseCSV = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            reject(new Error(`CSV parsing error: ${results.errors[0].message}`))
          } else {
            resolve(results.data)
          }
        },
        error: (error) => {
          reject(error)
        }
      })
    })
  }

  const parseXLSX = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const data = e.target?.result
          const workbook = XLSX.read(data, { type: 'binary' })
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
          const jsonData = XLSX.utils.sheet_to_json(firstSheet)
          resolve(jsonData)
        } catch (error) {
          reject(error)
        }
      }

      reader.onerror = () => {
        reject(new Error('Failed to read Excel file'))
      }

      reader.readAsBinaryString(file)
    })
  }

  const validatePreviewData = async () => {
    if (!file) return

    try {
      setIsUploading(true)
      setUploadProgress(20)

      // Parse file based on format
      let rawData: any[]
      if (format === 'csv') {
        rawData = await parseCSV(file)
      } else {
        rawData = await parseXLSX(file)
      }

      setUploadProgress(40)

      if (rawData.length === 0) {
        throw new Error('File is empty or contains no valid data')
      }

      if (rawData.length > 1000) {
        throw new Error('Maximum 1000 records allowed per import')
      }

      setUploadProgress(60)

      // Validate and transform data
      const validatedData: VoterRecord[] = rawData.map((record, index) => {
        const validation = validateRecord(record, index + 2) // +2 for header row and 1-indexed

        const voterRecord: VoterRecord = {
          studentId: record.studentId?.toString().toUpperCase().trim() || '',
          email: record.email?.toString().toLowerCase().trim() || '',
          firstName: record.firstName?.toString().trim() || '',
          lastName: record.lastName?.toString().trim() || '',
          middleName: record.middleName?.toString().trim() || undefined,
          phone: record.phone?.toString().trim() || undefined,
          faculty: record.faculty?.toString().trim() || '',
          department: record.department?.toString().trim() || '',
          course: record.course?.toString().trim() || '',
          yearOfStudy: parseInt(record.yearOfStudy) || 0,
          admissionYear: parseInt(record.admissionYear) || 0,
          status: validation.isValid ? 'valid' : 'error',
          errorMessage: validation.errors.join('; ')
        }

        return voterRecord
      })

      setUploadProgress(80)

      setPreviewData(validatedData)
      setUploadProgress(100)
      setStep('preview')

      const validCount = validatedData.filter(r => r.status === 'valid').length
      const errorCount = validatedData.filter(r => r.status === 'error').length

      if (errorCount > 0) {
        toast.error('Validation Warnings', `${errorCount} records have errors and will not be imported`)
      } else {
        toast.success('Validation Complete', `All ${validCount} records are valid`)
      }
    } catch (error: any) {
      toast.error('Parse Failed', error.message || 'Failed to parse file')
      console.error('File parsing error:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleImport = async () => {
    try {
      setIsUploading(true)
      setUploadProgress(0)

      // Filter out invalid records
      const validRecords = previewData.filter(r => r.status === 'valid')

      if (validRecords.length === 0) {
        throw new Error('No valid records to import')
      }

      setUploadProgress(10)

      // Prepare data for API
      const importData = {
        voters: validRecords.map(record => ({
          studentId: record.studentId,
          email: record.email,
          firstName: record.firstName,
          lastName: record.lastName,
          middleName: record.middleName,
          phone: record.phone,
          faculty: record.faculty,
          department: record.department,
          course: record.course,
          yearOfStudy: record.yearOfStudy,
          admissionYear: record.admissionYear,
        })),
        options: {
          overwriteExisting,
          sendWelcomeEmails,
          defaultPassword: defaultPassword || undefined,
        }
      }

      setUploadProgress(30)

      const token = localStorage.getItem('unielect-voting-access-token')
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/admin/voters/bulk-import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(importData)
      })

      setUploadProgress(70)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Import failed' }))
        throw new Error(errorData.message || 'Import failed')
      }

      const result = await response.json()

      setUploadProgress(90)

      // Prepare import result
      const importResultData: ImportResult = {
        totalRecords: validRecords.length,
        successfulImports: result.data?.successfulImports || validRecords.length,
        failedImports: result.data?.failedImports || 0,
        errors: result.data?.errors || [],
        warnings: result.data?.warnings || []
      }

      setImportResult(importResultData)
      setUploadProgress(100)
      setStep('result')

      if (importResultData.failedImports > 0) {
        toast.error('Import Completed with Errors', `${importResultData.successfulImports} imported, ${importResultData.failedImports} failed`)
      } else {
        toast.success('Import Complete', `Successfully imported ${importResultData.successfulImports} voters`)
      }
    } catch (error: any) {
      toast.error('Import Failed', error.message || 'Failed to import voters')
      console.error('Import error:', error)
      setUploadProgress(0)
    } finally {
      setIsUploading(false)
    }
  }

  const downloadTemplate = () => {
    const csvContent = `studentId,email,firstName,lastName,middleName,phone,faculty,department,course,yearOfStudy,admissionYear
ENS101-1234/2023,student@students.jkuat.ac.ke,John,Doe,Middle,+254712345678,School of Engineering,Electrical Engineering,Bachelor of Electrical Engineering,2,2023
SCI102-5678/2022,student2@students.jkuat.ac.ke,Jane,Smith,,0723456789,School of Computing and Information Technology,Computer Science,Bachelor of Computer Science,3,2022`

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'voter_import_template.csv'
    link.click()
    URL.revokeObjectURL(url)

    toast.success('Template Downloaded', 'Import template has been downloaded')
  }

  const resetImport = () => {
    setFile(null)
    setStep('upload')
    setPreviewData([])
    setImportResult(null)
    setUploadProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link href="/admin/voters">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Import Voters</h1>
            <p className="text-muted-foreground mt-1">
              Bulk import student voters from CSV or Excel files
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={downloadTemplate}>
          <Download className="h-4 w-4 mr-2" />
          Download Template
        </Button>
      </div>

      {/* Progress Indicator */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className={cn(
              "flex items-center space-x-2",
              step === 'upload' && "text-primary"
            )}>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center border-2",
                step === 'upload' ? "border-primary bg-primary text-primary-foreground" :
                (step === 'preview' || step === 'result') ? "border-primary bg-primary text-primary-foreground" : "border-muted"
              )}>
                <Upload className="h-4 w-4" />
              </div>
              <span className="font-medium">Upload File</span>
            </div>
            <Separator className="flex-1 mx-4" />
            <div className={cn(
              "flex items-center space-x-2",
              step === 'preview' && "text-primary"
            )}>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center border-2",
                step === 'preview' ? "border-primary bg-primary text-primary-foreground" :
                step === 'result' ? "border-primary bg-primary text-primary-foreground" : "border-muted"
              )}>
                <Eye className="h-4 w-4" />
              </div>
              <span className="font-medium">Preview</span>
            </div>
            <Separator className="flex-1 mx-4" />
            <div className={cn(
              "flex items-center space-x-2",
              step === 'result' && "text-primary"
            )}>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center border-2",
                step === 'result' ? "border-primary bg-primary text-primary-foreground" : "border-muted"
              )}>
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <span className="font-medium">Results</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Step */}
      {step === 'upload' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Voter Data</CardTitle>
              <CardDescription>
                Select a CSV or Excel file containing voter information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>File Requirements</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
                    <li>Supported formats: CSV (.csv) or Excel (.xlsx)</li>
                    <li>Maximum file size: 10MB</li>
                    <li>Maximum records: 1000 voters per import</li>
                    <li>Required columns: studentId, email, firstName, lastName, faculty, department, course, yearOfStudy, admissionYear</li>
                    <li>Optional columns: middleName, phone</li>
                  </ul>
                </AlertDescription>
              </Alert>

              {/* File Upload Area */}
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={cn(
                  "border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors",
                  file ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {file ? (
                  <div className="space-y-3">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                      <FileSpreadsheet className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <p className="text-lg font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setFile(null)
                        if (fileInputRef.current) {
                          fileInputRef.current.value = ''
                        }
                      }}
                    >
                      Change File
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-lg font-medium">Drop your file here or click to browse</p>
                      <p className="text-sm text-muted-foreground">
                        Supports CSV and XLSX files up to 10MB
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Import Options</CardTitle>
              <CardDescription>
                Configure how the import should be processed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start space-x-3 rounded-md border p-4">
                  <Checkbox
                    id="overwrite"
                    checked={overwriteExisting}
                    onCheckedChange={(checked) => setOverwriteExisting(checked as boolean)}
                  />
                  <div className="space-y-1 leading-none">
                    <Label htmlFor="overwrite" className="cursor-pointer">
                      Overwrite Existing Records
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Update existing voters if their student ID or email matches
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 rounded-md border p-4">
                  <Checkbox
                    id="welcome-emails"
                    checked={sendWelcomeEmails}
                    onCheckedChange={(checked) => setSendWelcomeEmails(checked as boolean)}
                  />
                  <div className="space-y-1 leading-none">
                    <Label htmlFor="welcome-emails" className="cursor-pointer">
                      Send Welcome Emails
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Send email notifications to newly imported voters with login credentials
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="default-password">Default Password (Optional)</Label>
                <Input
                  id="default-password"
                  type="password"
                  placeholder="Leave empty to generate random passwords"
                  value={defaultPassword}
                  onChange={(e) => setDefaultPassword(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Set a default password for all imported voters. If left empty, unique random passwords will be generated.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button
              onClick={validatePreviewData}
              disabled={!file || isUploading}
            >
              {isUploading ? (
                <>
                  <LoadingSpinner className="mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  Continue to Preview
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Preview Step */}
      {step === 'preview' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Preview Import Data</CardTitle>
                  <CardDescription>
                    Review the data before importing ({previewData.length} records)
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="bg-green-50">
                    <CheckCircle2 className="h-3 w-3 mr-1 text-green-600" />
                    {previewData.filter(r => r.status === 'valid').length} Valid
                  </Badge>
                  {previewData.filter(r => r.status === 'error').length > 0 && (
                    <Badge variant="outline" className="bg-red-50">
                      <XCircle className="h-3 w-3 mr-1 text-red-600" />
                      {previewData.filter(r => r.status === 'error').length} Errors
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {previewData.filter(r => r.status === 'error').length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Validation Errors Detected</AlertTitle>
                  <AlertDescription>
                    {previewData.filter(r => r.status === 'error').length} records have validation errors.
                    These records will be skipped during import. Hover over the error icon to see details.
                  </AlertDescription>
                </Alert>
              )}
              <ScrollArea className="h-[500px] w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Faculty</TableHead>
                      <TableHead>Year</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.map((record, index) => (
                      <TableRow key={index} className={cn(
                        record.status === 'error' && 'bg-red-50'
                      )}>
                        <TableCell>
                          <div title={record.status === 'error' ? record.errorMessage : record.status === 'valid' ? 'Valid' : 'Warning'}>
                            {record.status === 'valid' && (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            )}
                            {record.status === 'error' && (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                            {record.status === 'warning' && (
                              <AlertTriangle className="h-4 w-4 text-orange-600" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{record.studentId || '-'}</TableCell>
                        <TableCell>
                          {record.firstName} {record.middleName} {record.lastName}
                        </TableCell>
                        <TableCell className="text-sm">{record.email || '-'}</TableCell>
                        <TableCell className="text-sm">{record.faculty || '-'}</TableCell>
                        <TableCell>Year {record.yearOfStudy || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>

          {isUploading && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Importing voters...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep('upload')} disabled={isUploading}>
              Back
            </Button>
            <Button onClick={handleImport} disabled={isUploading}>
              {isUploading ? (
                <>
                  <LoadingSpinner className="mr-2" />
                  Importing...
                </>
              ) : (
                <>
                  Import {previewData.length} Voters
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Result Step */}
      {step === 'result' && importResult && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Import Complete</CardTitle>
              <CardDescription>
                Summary of the import operation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <div className="text-2xl font-bold">{importResult.totalRecords}</div>
                      <p className="text-sm text-muted-foreground">Total Records</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-green-200 bg-green-50/50">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-600" />
                      <div className="text-2xl font-bold text-green-600">{importResult.successfulImports}</div>
                      <p className="text-sm text-green-700">Successful</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className={cn(
                  importResult.failedImports > 0 && "border-red-200 bg-red-50/50"
                )}>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <XCircle className={cn(
                        "h-8 w-8 mx-auto mb-2",
                        importResult.failedImports > 0 ? "text-red-600" : "text-muted-foreground"
                      )} />
                      <div className={cn(
                        "text-2xl font-bold",
                        importResult.failedImports > 0 && "text-red-600"
                      )}>{importResult.failedImports}</div>
                      <p className={cn(
                        "text-sm",
                        importResult.failedImports > 0 ? "text-red-700" : "text-muted-foreground"
                      )}>Failed</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {importResult.errors.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2 text-red-600" />
                    Import Errors
                  </h3>
                  <ScrollArea className="h-[200px] w-full border rounded-md">
                    <div className="p-4 space-y-2">
                      {importResult.errors.map((error, index) => (
                        <Alert key={index} variant="destructive">
                          <AlertTitle>Row {error.row}</AlertTitle>
                          <AlertDescription>
                            {error.field && <span className="font-mono text-xs">{error.field}: </span>}
                            {error.message}
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={resetImport}>
              Import More Voters
            </Button>
            <Link href="/admin/voters">
              <Button>
                <Users className="h-4 w-4 mr-2" />
                View All Voters
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}