"use client"

import React, { useState, useCallback } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
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
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { useNotifications } from '@/lib/hooks/useNotifications'
import { cn } from '@/lib/utils/cn'
import  formatters  from '@/lib/utils/formatters'
import {
  FileText,
  Download,
  Calendar,
  Users,
  BarChart3,
  PieChart,
  TrendingUp,
  Clock,
  Settings,
  Eye,
  Trash2,
  RefreshCw,
  FileSpreadsheet,
  FileType,
  Image,
  PlayCircle,
  StopCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import type {
  Election,
  SafeUser,
  AvailableReport,
  ApiResponse,
} from '@/lib/types'
import {
  ElectionType,
  ElectionStatus,
  ELECTION_TYPE_LABELS,
  ELECTION_STATUS_LABELS,
  UNIVERSITY_FACULTIES,
  NotificationType,
} from '@/lib/enums'
import { API_ENDPOINTS } from '@/lib/constants'

interface ReportConfig {
  type: 'election' | 'user' | 'voting' | 'audit' | 'system'
  format: 'pdf' | 'excel' | 'csv' | 'json'
  dateRange: {
    from: Date
    to: Date
  }
  filters: {
    electionIds?: string[]
    electionTypes?: ElectionType[]
    electionStatuses?: ElectionStatus[]
    faculties?: string[]
    userRoles?: string[]
    includeArchived?: boolean
    includeSystemLogs?: boolean
  }
  options: {
    includeCharts?: boolean
    includeDetails?: boolean
    includeComparisons?: boolean
    includeMetadata?: boolean
    anonymize?: boolean
    watermark?: boolean
  }
}

interface GeneratedReport {
  id: string
  name: string
  type: string
  format: string
  status: 'generating' | 'completed' | 'failed'
  progress: number
  createdAt: Date
  completedAt?: Date
  downloadUrl?: string
  fileSize?: number
  error?: string
}

interface ReportTemplate {
  id: string
  name: string
  description: string
  type: string
  config: Partial<ReportConfig>
  isDefault: boolean
}

interface ReportsGeneratorProps {
  className?: string
}

const REPORT_TYPES = [
  {
    id: 'election',
    name: 'Election Reports',
    description: 'Comprehensive election results, statistics, and analysis',
    icon: BarChart3,
    color: 'text-blue-600 bg-blue-50'
  },
  {
    id: 'user',
    name: 'User Reports',
    description: 'User registration, activity, and demographic data',
    icon: Users,
    color: 'text-green-600 bg-green-50'
  },
  {
    id: 'voting',
    name: 'Voting Analytics',
    description: 'Voting patterns, turnout, and participation analysis',
    icon: TrendingUp,
    color: 'text-sage-600 bg-sage-50'
  },
  {
    id: 'audit',
    name: 'Audit Reports',
    description: 'System activity, security events, and compliance data',
    icon: FileText,
    color: 'text-orange-600 bg-orange-50'
  },
  {
    id: 'system',
    name: 'System Reports',
    description: 'Performance metrics, health status, and technical data',
    icon: Settings,
    color: 'text-red-600 bg-red-50'
  }
]

const REPORT_FORMATS = [
  { id: 'pdf', name: 'PDF Document', icon: FileType, extension: '.pdf' },
  { id: 'excel', name: 'Excel Spreadsheet', icon: FileSpreadsheet, extension: '.xlsx' },
  { id: 'csv', name: 'CSV File', icon: FileText, extension: '.csv' },
  { id: 'json', name: 'JSON Data', icon: FileText, extension: '.json' }
]

const DEFAULT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'comprehensive-election',
    name: 'Comprehensive Election Report',
    description: 'Complete election analysis with charts and detailed statistics',
    type: 'election',
    config: {
      format: 'pdf',
      options: {
        includeCharts: true,
        includeDetails: true,
        includeComparisons: true,
        includeMetadata: true
      }
    },
    isDefault: true
  },
  {
    id: 'voter-participation',
    name: 'Voter Participation Report',
    description: 'Detailed voter turnout and participation analysis',
    type: 'voting',
    config: {
      format: 'excel',
      options: {
        includeCharts: true,
        includeDetails: true,
        includeComparisons: true
      }
    },
    isDefault: true
  },
  {
    id: 'user-demographics',
    name: 'User Demographics Report',
    description: 'User registration and demographic breakdown',
    type: 'user',
    config: {
      format: 'pdf',
      options: {
        includeCharts: true,
        anonymize: true
      }
    },
    isDefault: true
  }
]

export const ReportsGenerator: React.FC<ReportsGeneratorProps> = ({
  className
}) => {
  const [activeTab, setActiveTab] = useState('generate')
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    type: 'election',
    format: 'pdf',
    dateRange: {
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      to: new Date()
    },
    filters: {
      includeArchived: false,
      includeSystemLogs: false
    },
    options: {
      includeCharts: true,
      includeDetails: true,
      includeComparisons: false,
      includeMetadata: false,
      anonymize: false,
      watermark: true
    }
  })
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [customName, setCustomName] = useState('')
  const [showPreview, setShowPreview] = useState(false)

  const { addNotification } = useNotifications()

  // Fetch available elections for filters
  const { data: elections } = useQuery({
    queryKey: ['elections-for-reports'],
    queryFn: async (): Promise<Election[]> => {
      const response = await fetch(API_ENDPOINTS.ELECTIONS.LIST)
      if (!response.ok) throw new Error('Failed to fetch elections')
      const result: ApiResponse<Election[]> = await response.json()
      return result.data || []
    }
  })

  // Fetch generated reports
  const {
    data: generatedReports,
    isLoading: reportsLoading,
    refetch: refetchReports
  } = useQuery({
    queryKey: ['generated-reports'],
    queryFn: async (): Promise<GeneratedReport[]> => {
      const response = await fetch(API_ENDPOINTS.REPORTS.SYSTEM)
      if (!response.ok) throw new Error('Failed to fetch reports')
      const result: ApiResponse<GeneratedReport[]> = await response.json()
      return result.data || []
    },
    refetchInterval: 5000 // Refresh every 5 seconds to update progress
  })

  // Generate report mutation
  const generateReportMutation = useMutation({
    mutationFn: async (config: ReportConfig & { name: string }): Promise<GeneratedReport> => {
      const response = await fetch(API_ENDPOINTS.ADMIN.GENERATE_REPORT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config)
      })

      if (!response.ok) {
        throw new Error('Failed to generate report')
      }

      const result: ApiResponse<GeneratedReport> = await response.json()
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to generate report')
      }

      return result.data
    },
    onSuccess: (report) => {
      addNotification({
        type: NotificationType.SUCCESS,
        title: 'Report Generation Started',
        message: `Report "${report.name}" is being generated`
      })
      refetchReports()
      setActiveTab('history')
    },
    onError: (error) => {
      addNotification({
        type: NotificationType.ERROR,
        title: 'Generation Failed',
        message: error instanceof Error ? error.message : 'Failed to generate report'
      })
    }
  })

  const handleConfigChange = useCallback((key: keyof ReportConfig, value: any) => {
    setReportConfig(prev => ({ ...prev, [key]: value }))
  }, [])

  const handleFilterChange = useCallback((key: string, value: any) => {
    setReportConfig(prev => ({
      ...prev,
      filters: { ...prev.filters, [key]: value }
    }))
  }, [])

  const handleOptionChange = useCallback((key: string, value: any) => {
    setReportConfig(prev => ({
      ...prev,
      options: { ...prev.options, [key]: value }
    }))
  }, [])

  const applyTemplate = useCallback((template: ReportTemplate) => {
    setReportConfig(prev => ({
      ...prev,
      ...template.config,
      type: template.type as any
    }))
    setSelectedTemplate(template.id)
    setCustomName(template.name)
  }, [])

  const handleGenerate = useCallback(() => {
    if (!customName.trim()) {
      addNotification({
        type: NotificationType.ERROR,
        title: 'Missing Name',
        message: 'Please enter a name for the report'
      })
      return
    }

    generateReportMutation.mutate({
      ...reportConfig,
      name: customName.trim()
    })
  }, [reportConfig, customName, generateReportMutation, addNotification])

  const downloadReport = useCallback(async (report: GeneratedReport) => {
    if (!report.downloadUrl) return

    try {
      const response = await fetch(report.downloadUrl)
      if (!response.ok) throw new Error('Download failed')

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${report.name}${REPORT_FORMATS.find(f => f.id === report.format)?.extension || ''}`
      link.click()
      URL.revokeObjectURL(url)

      addNotification({
        type: NotificationType.SUCCESS,
        title: 'Download Complete',
        message: `Report "${report.name}" downloaded successfully`
      })
    } catch (error) {
      addNotification({
        type: NotificationType.ERROR,
        title: 'Download Failed',
        message: 'Failed to download report'
      })
    }
  }, [addNotification])

  const selectedReportType = REPORT_TYPES.find(type => type.id === reportConfig.type)
  const selectedFormat = REPORT_FORMATS.find(format => format.id === reportConfig.format)

  return (
    <div className={cn("space-y-6", className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Reports Generator
          </CardTitle>
          <CardDescription>
            Generate comprehensive reports for elections, users, and system analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="generate">Generate Report</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="history">
                History
                {generatedReports?.length ? (
                  <Badge variant="secondary" className="ml-2">
                    {generatedReports.length}
                  </Badge>
                ) : null}
              </TabsTrigger>
            </TabsList>

            {/* Generate Report Tab */}
            <TabsContent value="generate" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Report Configuration */}
                <div className="space-y-6">
                  {/* Report Type */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Report Type</Label>
                    <div className="grid grid-cols-1 gap-3">
                      {REPORT_TYPES.map(type => {
                        const Icon = type.icon
                        return (
                          <Card
                            key={type.id}
                            className={cn(
                              "cursor-pointer transition-all hover:shadow-sm",
                              reportConfig.type === type.id && "ring-2 ring-primary"
                            )}
                            onClick={() => handleConfigChange('type', type.id)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <div className={cn("p-2 rounded-lg", type.color)}>
                                  <Icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-medium">{type.name}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {type.description}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </div>

                  {/* Report Name */}
                  <div className="space-y-2">
                    <Label htmlFor="reportName">Report Name</Label>
                    <Input
                      id="reportName"
                      placeholder="Enter report name..."
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                    />
                  </div>

                  {/* Format Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="format">Output Format</Label>
                    <Select
                      value={reportConfig.format}
                      onValueChange={(value) => handleConfigChange('format', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        {REPORT_FORMATS.map(format => {
                          const Icon = format.icon
                          return (
                            <SelectItem key={format.id} value={format.id}>
                              <div className="flex items-center gap-2">
                                <Icon className="w-4 h-4" />
                                {format.name}
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date Range */}
                  <div className="space-y-2">
                    <Label>Date Range</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="dateFrom" className="text-sm">From</Label>
                        <Input
                          id="dateFrom"
                          type="date"
                          value={reportConfig.dateRange.from.toISOString().split('T')[0]}
                          onChange={(e) => handleConfigChange('dateRange', {
                            ...reportConfig.dateRange,
                            from: new Date(e.target.value)
                          })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="dateTo" className="text-sm">To</Label>
                        <Input
                          id="dateTo"
                          type="date"
                          value={reportConfig.dateRange.to.toISOString().split('T')[0]}
                          onChange={(e) => handleConfigChange('dateRange', {
                            ...reportConfig.dateRange,
                            to: new Date(e.target.value)
                          })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Filters and Options */}
                <div className="space-y-6">
                  {/* Filters */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Filters</Label>

                    {/* Election-specific filters */}
                    {(reportConfig.type === 'election' || reportConfig.type === 'voting') && (
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="electionTypes">Election Types</Label>
                          <Select
                            onValueChange={(value) => handleFilterChange('electionTypes', [value])}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="All types" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">All types</SelectItem>
                              {Object.entries(ELECTION_TYPE_LABELS).map(([key, label]) => (
                                <SelectItem key={key} value={key}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="electionStatuses">Election Status</Label>
                          <Select
                            onValueChange={(value) => handleFilterChange('electionStatuses', [value])}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="All statuses" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">All statuses</SelectItem>
                              {Object.entries(ELECTION_STATUS_LABELS).map(([key, label]) => (
                                <SelectItem key={key} value={key}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {/* User-specific filters */}
                    {reportConfig.type === 'user' && (
                      <div>
                        <Label htmlFor="faculties">Faculties</Label>
                        <Select
                          onValueChange={(value) => handleFilterChange('faculties', [value])}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="All faculties" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">All faculties</SelectItem>
                            {UNIVERSITY_FACULTIES.map(faculty => (
                              <SelectItem key={faculty} value={faculty}>
                                {faculty}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* General filters */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="includeArchived"
                          checked={reportConfig.filters.includeArchived}
                          onCheckedChange={(checked) =>
                            handleFilterChange('includeArchived', checked)
                          }
                        />
                        <Label htmlFor="includeArchived">Include archived data</Label>
                      </div>

                      {reportConfig.type === 'audit' && (
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="includeSystemLogs"
                            checked={reportConfig.filters.includeSystemLogs}
                            onCheckedChange={(checked) =>
                              handleFilterChange('includeSystemLogs', checked)
                            }
                          />
                          <Label htmlFor="includeSystemLogs">Include system logs</Label>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Options */}
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Report Options</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="includeCharts"
                          checked={reportConfig.options.includeCharts}
                          onCheckedChange={(checked) =>
                            handleOptionChange('includeCharts', checked)
                          }
                        />
                        <Label htmlFor="includeCharts">Include charts and graphs</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="includeDetails"
                          checked={reportConfig.options.includeDetails}
                          onCheckedChange={(checked) =>
                            handleOptionChange('includeDetails', checked)
                          }
                        />
                        <Label htmlFor="includeDetails">Include detailed data</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="includeComparisons"
                          checked={reportConfig.options.includeComparisons}
                          onCheckedChange={(checked) =>
                            handleOptionChange('includeComparisons', checked)
                          }
                        />
                        <Label htmlFor="includeComparisons">Include period comparisons</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="includeMetadata"
                          checked={reportConfig.options.includeMetadata}
                          onCheckedChange={(checked) =>
                            handleOptionChange('includeMetadata', checked)
                          }
                        />
                        <Label htmlFor="includeMetadata">Include technical metadata</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="anonymize"
                          checked={reportConfig.options.anonymize}
                          onCheckedChange={(checked) =>
                            handleOptionChange('anonymize', checked)
                          }
                        />
                        <Label htmlFor="anonymize">Anonymize personal data</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="watermark"
                          checked={reportConfig.options.watermark}
                          onCheckedChange={(checked) =>
                            handleOptionChange('watermark', checked)
                          }
                        />
                        <Label htmlFor="watermark">Add watermark</Label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <div className="flex items-center justify-between pt-6 border-t">
                <div className="text-sm text-muted-foreground">
                  Report will be generated as {selectedFormat?.name} format
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowPreview(true)}
                    disabled={!customName.trim()}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                  <Button
                    onClick={handleGenerate}
                    disabled={generateReportMutation.isPending || !customName.trim()}
                  >
                    {generateReportMutation.isPending && (
                      <LoadingSpinner className="w-4 h-4 mr-2" />
                    )}
                    Generate Report
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Templates Tab */}
            <TabsContent value="templates" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {DEFAULT_TEMPLATES.map(template => {
                  const reportType = REPORT_TYPES.find(type => type.id === template.type)
                  const Icon = reportType?.icon || FileText

                  return (
                    <Card
                      key={template.id}
                      className={cn(
                        "cursor-pointer transition-all hover:shadow-sm",
                        selectedTemplate === template.id && "ring-2 ring-primary"
                      )}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <div className={cn("p-2 rounded-lg", reportType?.color)}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium">{template.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {template.description}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => applyTemplate(template)}
                            >
                              Apply Template
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-4">
              {reportsLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : generatedReports && generatedReports.length > 0 ? (
                <div className="space-y-4">
                  {generatedReports.map(report => {
                    const format = REPORT_FORMATS.find(f => f.id === report.format)
                    const FormatIcon = format?.icon || FileText

                    return (
                      <Card key={report.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-muted">
                                <FormatIcon className="w-5 h-5" />
                              </div>
                              <div>
                                <h4 className="font-medium">{report.name}</h4>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <span>{format?.name}</span>
                                  <span>"</span>
                                  <span>{formatters.formatDateTime(report.createdAt)}</span>
                                  {report.fileSize && (
                                    <>
                                      <span>"</span>
                                      <span>{formatters.formatFileSize(report.fileSize)}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {report.status === 'generating' && (
                                <div className="flex items-center gap-2">
                                  <LoadingSpinner className="w-4 h-4" />
                                  <span className="text-sm">{report.progress}%</span>
                                </div>
                              )}

                              {report.status === 'completed' && (
                                <Badge variant="success">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Completed
                                </Badge>
                              )}

                              {report.status === 'failed' && (
                                <Badge variant="destructive">
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Failed
                                </Badge>
                              )}

                              {report.status === 'completed' && report.downloadUrl && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => downloadReport(report)}
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  Download
                                </Button>
                              )}
                            </div>
                          </div>

                          {report.status === 'generating' && (
                            <div className="mt-3">
                              <Progress value={report.progress} className="w-full" />
                            </div>
                          )}

                          {report.error && (
                            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                              {report.error}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No reports generated yet
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

export default ReportsGenerator