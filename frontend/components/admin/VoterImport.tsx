"use client"

import React, { useState, useCallback, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { useNotifications } from '@/lib/hooks/useNotifications'
import { cn } from '@/lib/utils/cn'
import {
  Upload,
  Download,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  Users,
  FileSpreadsheet,
  Info,
  Trash2,
} from 'lucide-react'
import {
  SafeUser,
  VoterImportData,
  ApiResponse,
  PaginatedResponse,
} from '@/lib/types'
import { API_ENDPOINTS } from '@/lib/constants'
import { NotificationType, UNIVERSITY_FACULTIES } from '@/lib/enums'

interface ImportResult {
  total: number
  successful: number
  failed: number
  duplicates: number
  errors: ImportError[]
  imported: SafeUser[]
}

interface ImportError {
  row: number
  email?: string
  studentId?: string
  errors: string[]
}

interface ImportPreview {
  headers: string[]
  rows: string[][]
  mapping: Record<string, string>
  totalRows: number
}

interface VoterImportProps {
  className?: string
  onImportComplete?: (result: ImportResult) => void
}

const REQUIRED_FIELDS = [
  'studentId',
  'email',
  'firstName',
  'lastName',
  'faculty',
  'department',
  'course',
  'yearOfStudy',
  'admissionYear'
]

const OPTIONAL_FIELDS = [
  'middleName',
  'phone'
]

const FIELD_LABELS = {
  studentId: 'Student ID',
  email: 'Email',
  firstName: 'First Name',
  lastName: 'Last Name',
  middleName: 'Middle Name',
  phone: 'Phone',
  faculty: 'Faculty',
  department: 'Department',
  course: 'Course',
  yearOfStudy: 'Year of Study',
  admissionYear: 'Admission Year'
}

const sampleData = [
  ['StudentID', 'Email', 'FirstName', 'LastName', 'MiddleName', 'Phone', 'Faculty', 'Department', 'Course', 'YearOfStudy', 'AdmissionYear'],
  ['EN123-4567/2020', 'john.doe@students.unielect.edu', 'John', 'Doe', 'Michael', '+254712345678', 'School of Engineering', 'Mechanical Engineering', 'Mechanical Engineering', '3', '2020'],
  ['IT456-7890/2021', 'jane.smith@students.unielect.edu', 'Jane', 'Smith', '', '+254723456789', 'School of Computing and Information Technology', 'Computer Science', 'Computer Science', '2', '2021'],
  ['AG789-0123/2019', 'bob.johnson@students.unielect.edu', 'Bob', 'Johnson', 'William', '+254734567890', 'School of Agriculture and Biotechnology', 'Agricultural Engineering', 'Agricultural Engineering', '4', '2019']
]

export const VoterImport: React.FC<VoterImportProps> = ({
  className,
  onImportComplete
}) => {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [importOptions, setImportOptions] = useState({
    skipDuplicates: true,
    updateExisting: false,
    validateEmails: true,
    validateStudentIds: true
  })
  const [showMapping, setShowMapping] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const { addNotification } = useNotifications()

  const importMutation = useMutation({
    mutationFn: async (data: {
      file: File
      mapping: Record<string, string>
      options: typeof importOptions
    }): Promise<ImportResult> => {
      const formData = new FormData()
      formData.append('file', data.file)
      formData.append('mapping', JSON.stringify(data.mapping))
      formData.append('options', JSON.stringify(data.options))

      const response = await fetch(API_ENDPOINTS.ADMIN.IMPORT_USERS, {
        method: 'POST',
        body: formData,
        // Add progress tracking
        onUploadProgress: (progressEvent: any) => {
          if (progressEvent.lengthComputable) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            setUploadProgress(progress)
          }
        }
      } as any)

      if (!response.ok) {
        throw new Error('Import failed')
      }

      const result: ApiResponse<ImportResult> = await response.json()
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Import failed')
      }

      return result.data
    },
    onSuccess: (result) => {
      setImportResult(result)
      setShowResults(true)
      setUploadProgress(0)

      if (result.successful > 0) {
        addNotification({
          type: NotificationType.SUCCESS,
          title: 'Import Successful',
          message: `Successfully imported ${result.successful} voters`
        })
      }

      if (result.failed > 0) {
        addNotification({
          type: NotificationType.ERROR,
          title: 'Import Completed with Errors',
          message: `${result.failed} records failed to import`
        })
      }

      onImportComplete?.(result)
    },
    onError: (error) => {
      setUploadProgress(0)
      addNotification({
        type: NotificationType.ERROR,
        title: 'Import Failed',
        message: error instanceof Error ? error.message : 'Failed to import voters'
      })
    }
  })

  const handleFileSelect = useCallback((selectedFile: File) => {
    setFile(selectedFile)

    // Parse file for preview
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split('\n').filter(line => line.trim())

      if (lines.length < 2) {
        addNotification({
          type: NotificationType.ERROR,
          title: 'Invalid File',
          message: 'File must contain at least a header row and one data row'
        })
        return
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
      const rows = lines.slice(1, 6).map(line =>
        line.split(',').map(cell => cell.trim().replace(/"/g, ''))
      )

      // Auto-detect field mapping
      const mapping: Record<string, string> = {}
      const allFields = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS]

      headers.forEach(header => {
        const normalizedHeader = header.toLowerCase().replace(/[^a-z]/g, '')
        const matchedField = allFields.find(field => {
          const normalizedField = field.toLowerCase()
          return normalizedHeader.includes(normalizedField) ||
                 normalizedField.includes(normalizedHeader)
        })
        if (matchedField) {
          mapping[matchedField] = header
        }
      })

      setPreview({
        headers,
        rows,
        mapping,
        totalRows: lines.length - 1
      })
      setShowMapping(true)
    }

    reader.readAsText(selectedFile)
  }, [addNotification])

  const handleFileDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && (droppedFile.type === 'text/csv' || droppedFile.name.endsWith('.csv'))) {
      handleFileSelect(droppedFile)
    } else {
      addNotification({
        type: NotificationType.ERROR,
        title: 'Invalid File Type',
        message: 'Please select a CSV file'
      })
    }
  }, [handleFileSelect, addNotification])

  const handleImport = useCallback(() => {
    if (!file || !preview) return

    // Validate required field mappings
    const missingFields = REQUIRED_FIELDS.filter(field => !preview.mapping[field])
    if (missingFields.length > 0) {
      addNotification({
        type: NotificationType.ERROR,
        title: 'Missing Required Fields',
        message: `Please map the following required fields: ${missingFields.map(f => FIELD_LABELS[f as keyof typeof FIELD_LABELS]).join(', ')}`
      })
      return
    }

    setShowMapping(false)
    importMutation.mutate({
      file,
      mapping: preview.mapping,
      options: importOptions
    })
  }, [file, preview, importOptions, importMutation, addNotification])

  const downloadTemplate = useCallback(() => {
    const csvContent = sampleData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'voter_import_template.csv'
    link.click()
    URL.revokeObjectURL(url)
  }, [])

  const resetImport = useCallback(() => {
    setFile(null)
    setPreview(null)
    setShowMapping(false)
    setShowResults(false)
    setImportResult(null)
    setUploadProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  return (
    <div className={cn("space-y-6", className)}>
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import Voters
          </CardTitle>
          <CardDescription>
            Upload a CSV file to import multiple voters at once
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!file ? (
            <>
              {/* File Upload */}
              <div
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors"
                onDrop={handleFileDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <div className="space-y-2">
                  <p className="text-lg font-medium">Drop your CSV file here</p>
                  <p className="text-sm text-muted-foreground">
                    or click to browse files
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Choose File
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    const selectedFile = e.target.files?.[0]
                    if (selectedFile) handleFileSelect(selectedFile)
                  }}
                />
              </div>

              {/* Template Download */}
              <Alert>
                <Info className="w-4 h-4" />
                <AlertTitle>Need a template?</AlertTitle>
                <AlertDescription className="flex items-center justify-between">
                  <span>
                    Download our CSV template with the correct format and sample data
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadTemplate}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Template
                  </Button>
                </AlertDescription>
              </Alert>

              {/* Import Guidelines */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Import Guidelines:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>" File must be in CSV format</li>
                  <li>" Maximum file size: 10MB</li>
                  <li>" Maximum 1000 records per import</li>
                  <li>" Required fields: Student ID, Email, First Name, Last Name, Faculty, Department, Course, Year of Study, Admission Year</li>
                  <li>" Email addresses must be unique</li>
                  <li>" Student IDs must follow UniElect format (e.g., EN123-4567/2020)</li>
                </ul>
              </div>
            </>
          ) : (
            /* File Selected */
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB " {preview?.totalRows || 0} records
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetImport}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove
                </Button>
              </div>

              {/* Import Options */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Import Options:</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="skipDuplicates"
                      checked={importOptions.skipDuplicates}
                      onCheckedChange={(checked) =>
                        setImportOptions(prev => ({ ...prev, skipDuplicates: checked as boolean }))
                      }
                    />
                    <Label htmlFor="skipDuplicates">Skip duplicate records</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="updateExisting"
                      checked={importOptions.updateExisting}
                      onCheckedChange={(checked) =>
                        setImportOptions(prev => ({ ...prev, updateExisting: checked as boolean }))
                      }
                    />
                    <Label htmlFor="updateExisting">Update existing records</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="validateEmails"
                      checked={importOptions.validateEmails}
                      onCheckedChange={(checked) =>
                        setImportOptions(prev => ({ ...prev, validateEmails: checked as boolean }))
                      }
                    />
                    <Label htmlFor="validateEmails">Validate email addresses</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="validateStudentIds"
                      checked={importOptions.validateStudentIds}
                      onCheckedChange={(checked) =>
                        setImportOptions(prev => ({ ...prev, validateStudentIds: checked as boolean }))
                      }
                    />
                    <Label htmlFor="validateStudentIds">Validate Student IDs</Label>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => setShowMapping(true)}
                className="w-full"
                disabled={!preview}
              >
                Review & Map Fields
              </Button>
            </div>
          )}

          {/* Progress Bar */}
          {importMutation.isPending && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Importing voters...</span>
                <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Field Mapping Dialog */}
      <Dialog open={showMapping} onOpenChange={setShowMapping}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Map CSV Fields</DialogTitle>
            <DialogDescription>
              Map your CSV columns to the required fields. Required fields are marked with *
            </DialogDescription>
          </DialogHeader>

          {preview && (
            <div className="space-y-4">
              {/* Field Mapping */}
              <div className="grid grid-cols-2 gap-4">
                {[...REQUIRED_FIELDS, ...OPTIONAL_FIELDS].map(field => (
                  <div key={field} className="space-y-2">
                    <Label htmlFor={field}>
                      {FIELD_LABELS[field as keyof typeof FIELD_LABELS]}
                      {REQUIRED_FIELDS.includes(field) && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </Label>
                    <select
                      id={field}
                      className="w-full p-2 border rounded-md"
                      value={preview.mapping[field] || ''}
                      onChange={(e) => {
                        setPreview(prev => prev ? {
                          ...prev,
                          mapping: { ...prev.mapping, [field]: e.target.value }
                        } : null)
                      }}
                    >
                      <option value="">-- Select Column --</option>
                      {preview.headers.map(header => (
                        <option key={header} value={header}>
                          {header}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {/* Preview Data */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Data Preview (first 5 rows):</h4>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {preview.headers.map(header => (
                          <TableHead key={header} className="text-xs">
                            {header}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preview.rows.map((row, index) => (
                        <TableRow key={index}>
                          {row.map((cell, cellIndex) => (
                            <TableCell key={cellIndex} className="text-xs">
                              {cell}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Validation Summary */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Validation Summary:</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    {REQUIRED_FIELDS.every(field => preview.mapping[field]) ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span className="text-sm">Required fields mapped</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span className="text-sm">{preview.totalRows} records to import</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowMapping(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!preview || !REQUIRED_FIELDS.every(field => preview.mapping[field])}
            >
              Start Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Results Dialog */}
      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Import Results</DialogTitle>
            <DialogDescription>
              Import completed. Review the results below.
            </DialogDescription>
          </DialogHeader>

          {importResult && (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {importResult.total}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Records</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {importResult.successful}
                  </div>
                  <div className="text-sm text-muted-foreground">Successful</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {importResult.failed}
                  </div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {importResult.duplicates}
                  </div>
                  <div className="text-sm text-muted-foreground">Duplicates</div>
                </div>
              </div>

              {/* Errors */}
              {importResult.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-red-600">Import Errors:</h4>
                  <div className="max-h-60 overflow-y-auto border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Row</TableHead>
                          <TableHead>Student ID</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Errors</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {importResult.errors.map((error, index) => (
                          <TableRow key={index}>
                            <TableCell>{error.row}</TableCell>
                            <TableCell>{error.studentId || 'N/A'}</TableCell>
                            <TableCell>{error.email || 'N/A'}</TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {error.errors.map((err, errIndex) => (
                                  <Badge key={errIndex} variant="destructive" className="mr-1">
                                    {err}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Successfully Imported Users */}
              {importResult.imported.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-green-600">
                    Successfully Imported ({importResult.imported.length}):
                  </h4>
                  <div className="max-h-60 overflow-y-auto border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student ID</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Faculty</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {importResult.imported.slice(0, 50).map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-mono text-sm">
                              {user.studentId}
                            </TableCell>
                            <TableCell>
                              {user.firstName} {user.lastName}
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{user.faculty}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {importResult.imported.length > 50 && (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        ... and {importResult.imported.length - 50} more
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowResults(false)}
            >
              Close
            </Button>
            <Button
              onClick={resetImport}
            >
              Import More
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default VoterImport