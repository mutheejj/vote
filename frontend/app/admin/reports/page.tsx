"use client"

import React from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ReportsGenerator } from '@/components/admin/ReportsGenerator'
import { useAuth } from '@/lib/hooks/useAuth'
import { FileText, BarChart3, Users, Activity, Shield } from 'lucide-react'

export default function AdminReportsPage() {
  const { user } = useAuth()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Generate comprehensive reports and export data for analysis
          </p>
        </div>
      </div>

      {/* Information Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Election Reports</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">Elections</div>
            <p className="text-xs text-muted-foreground mt-1">
              Results, statistics, and analysis
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Reports</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Users</div>
            <p className="text-xs text-muted-foreground mt-1">
              Registration and demographic data
            </p>
          </CardContent>
        </Card>

        <Card className="border-sage-200 bg-sage-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Voting Analytics</CardTitle>
            <Activity className="h-4 w-4 text-sage-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-sage-600">Analytics</div>
            <p className="text-xs text-muted-foreground mt-1">
              Participation and trends
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Audit Reports</CardTitle>
            <Shield className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">Security</div>
            <p className="text-xs text-muted-foreground mt-1">
              System activity and compliance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Report Generator */}
      <ReportsGenerator />

      {/* Additional Information */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Report Types Available</CardTitle>
            <CardDescription>
              Different types of reports you can generate
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                Election Reports
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                <li>" Comprehensive election results and statistics</li>
                <li>" Candidate performance analysis</li>
                <li>" Voter turnout and participation rates</li>
                <li>" Position-wise detailed breakdowns</li>
                <li>" Historical election comparisons</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4 text-green-600" />
                User Reports
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                <li>" User registration and demographic data</li>
                <li>" Faculty and department distributions</li>
                <li>" User role and permission breakdowns</li>
                <li>" Registration trends over time</li>
                <li>" Account verification status</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Activity className="w-4 h-4 text-sage-600" />
                Voting Analytics
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                <li>" Voting patterns and participation analysis</li>
                <li>" Peak voting times and trends</li>
                <li>" Device and platform breakdowns</li>
                <li>" Geographic voting distribution</li>
                <li>" Session duration and completion rates</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Export Formats</CardTitle>
            <CardDescription>
              Choose from multiple output formats
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-red-600" />
                  <div>
                    <p className="font-medium">PDF Document</p>
                    <p className="text-sm text-muted-foreground">
                      Professional reports with charts
                    </p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">Recommended</span>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="font-medium">Excel Spreadsheet</p>
                    <p className="text-sm text-muted-foreground">
                      Data analysis and manipulation
                    </p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">Data Analysis</span>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="font-medium">CSV File</p>
                    <p className="text-sm text-muted-foreground">
                      Raw data for external tools
                    </p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">Raw Data</span>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-sage-600" />
                  <div>
                    <p className="font-medium">JSON Data</p>
                    <p className="text-sm text-muted-foreground">
                      API integration and processing
                    </p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">Developers</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Report Generation Guidelines</CardTitle>
          <CardDescription>
            Best practices for generating and using reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="font-medium">Data Privacy & Security</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>" Use anonymization for sensitive user data</li>
                <li>" Enable watermarks for official reports</li>
                <li>" Follow data protection regulations</li>
                <li>" Limit access based on user roles</li>
                <li>" Secure transmission and storage</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Performance Optimization</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>" Use appropriate date ranges for large datasets</li>
                <li>" Select only needed data fields</li>
                <li>" Generate reports during off-peak hours</li>
                <li>" Schedule recurring reports in advance</li>
                <li>" Monitor system resources during generation</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Report Quality</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>" Include relevant metadata and context</li>
                <li>" Use charts for better data visualization</li>
                <li>" Provide clear titles and descriptions</li>
                <li>" Include generation timestamp</li>
                <li>" Validate data accuracy before sharing</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Compliance & Audit</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>" Log all report generation activities</li>
                <li>" Maintain report access audit trails</li>
                <li>" Follow institutional reporting standards</li>
                <li>" Document report usage and distribution</li>
                <li>" Retain reports as per policy requirements</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}