"use client"

import React from "react"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement,
} from 'chart.js'
import { Bar, Doughnut, Line, Pie } from 'react-chartjs-2'
import { cn } from "@/lib/utils/cn"

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement
)

// JKUAT Brand Colors
const COLORS = {
  primary: '#0F4C75',
  secondary: '#3282B8',
  accent: '#BBE1FA',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  neutral: '#6B7280',
  light: '#F9FAFB',
}

const chartColors = [
  COLORS.primary,
  COLORS.secondary,
  COLORS.success,
  COLORS.warning,
  COLORS.error,
  COLORS.accent,
  COLORS.neutral,
]

interface ChartProps {
  className?: string
  title?: string
  subtitle?: string
}

interface BarChartProps extends ChartProps {
  data: {
    labels: string[]
    datasets: Array<{
      label: string
      data: number[]
      backgroundColor?: string | string[]
      borderColor?: string | string[]
      borderWidth?: number
    }>
  }
  options?: any
}

interface DoughnutChartProps extends ChartProps {
  data: {
    labels: string[]
    datasets: Array<{
      data: number[]
      backgroundColor?: string[]
      borderColor?: string[]
      borderWidth?: number
    }>
  }
  options?: any
}

interface LineChartProps extends ChartProps {
  data: {
    labels: string[]
    datasets: Array<{
      label: string
      data: number[]
      borderColor?: string
      backgroundColor?: string
      tension?: number
      fill?: boolean
    }>
  }
  options?: any
}

const defaultOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        usePointStyle: true,
        padding: 20,
        font: {
          family: 'Inter, sans-serif',
          size: 12,
        },
      },
    },
    tooltip: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      titleColor: '#1F2937',
      bodyColor: '#374151',
      borderColor: '#E5E7EB',
      borderWidth: 1,
      cornerRadius: 8,
      padding: 12,
      boxPadding: 6,
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        font: {
          family: 'Inter, sans-serif',
          size: 11,
        },
        color: '#6B7280',
      },
    },
    y: {
      grid: {
        color: '#F3F4F6',
      },
      ticks: {
        font: {
          family: 'Inter, sans-serif',
          size: 11,
        },
        color: '#6B7280',
      },
    },
  },
}

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        usePointStyle: true,
        padding: 20,
        font: {
          family: 'Inter, sans-serif',
          size: 12,
        },
      },
    },
    tooltip: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      titleColor: '#1F2937',
      bodyColor: '#374151',
      borderColor: '#E5E7EB',
      borderWidth: 1,
      cornerRadius: 8,
      padding: 12,
      callbacks: {
        label: function(context: any) {
          const label = context.label || ''
          const value = context.parsed || 0
          const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
          const percentage = ((value / total) * 100).toFixed(1)
          return `${label}: ${value} (${percentage}%)`
        }
      }
    },
  },
  cutout: '60%',
}

export function BarChart({ data, options, className, title, subtitle }: BarChartProps) {
  // Apply default colors if not provided
  const processedData = {
    ...data,
    datasets: data.datasets.map((dataset, index) => ({
      ...dataset,
      backgroundColor: dataset.backgroundColor || chartColors[index % chartColors.length],
      borderColor: dataset.borderColor || chartColors[index % chartColors.length],
      borderWidth: dataset.borderWidth || 2,
      borderRadius: 4,
      borderSkipped: false,
    }))
  }

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    plugins: {
      ...defaultOptions.plugins,
      ...options?.plugins,
      title: title ? {
        display: true,
        text: title,
        color: '#1F2937',
        font: {
          family: 'Inter, sans-serif',
          size: 16,
          weight: 'bold' as const,
        },
        padding: 20,
      } : undefined,
    },
  }

  return (
    <div className={cn("w-full", className)}>
      {subtitle && (
        <p className="text-sm text-muted-foreground mb-4 text-center">{subtitle}</p>
      )}
      <div className="h-[300px] w-full">
        <Bar data={processedData} options={mergedOptions} />
      </div>
    </div>
  )
}

export function DoughnutChart({ data, options, className, title, subtitle }: DoughnutChartProps) {
  // Apply default colors if not provided
  const processedData = {
    ...data,
    datasets: data.datasets.map((dataset) => ({
      ...dataset,
      backgroundColor: dataset.backgroundColor || chartColors,
      borderColor: dataset.borderColor || Array(data.labels.length).fill('#FFFFFF'),
      borderWidth: dataset.borderWidth || 2,
    }))
  }

  const mergedOptions = {
    ...doughnutOptions,
    ...options,
    plugins: {
      ...doughnutOptions.plugins,
      ...options?.plugins,
      title: title ? {
        display: true,
        text: title,
        color: '#1F2937',
        font: {
          family: 'Inter, sans-serif',
          size: 16,
          weight: 'bold' as const,
        },
        padding: 20,
      } : undefined,
    },
  }

  return (
    <div className={cn("w-full", className)}>
      {subtitle && (
        <p className="text-sm text-muted-foreground mb-4 text-center">{subtitle}</p>
      )}
      <div className="h-[300px] w-full">
        <Doughnut data={processedData} options={mergedOptions} />
      </div>
    </div>
  )
}

export function PieChart({ data, options, className, title, subtitle }: DoughnutChartProps) {
  // Apply default colors if not provided
  const processedData = {
    ...data,
    datasets: data.datasets.map((dataset) => ({
      ...dataset,
      backgroundColor: dataset.backgroundColor || chartColors,
      borderColor: dataset.borderColor || Array(data.labels.length).fill('#FFFFFF'),
      borderWidth: dataset.borderWidth || 2,
    }))
  }

  const pieOptions = {
    ...doughnutOptions,
    cutout: 0, // Makes it a pie chart instead of doughnut
  }

  const mergedOptions = {
    ...pieOptions,
    ...options,
    plugins: {
      ...pieOptions.plugins,
      ...options?.plugins,
      title: title ? {
        display: true,
        text: title,
        color: '#1F2937',
        font: {
          family: 'Inter, sans-serif',
          size: 16,
          weight: 'bold' as const,
        },
        padding: 20,
      } : undefined,
    },
  }

  return (
    <div className={cn("w-full", className)}>
      {subtitle && (
        <p className="text-sm text-muted-foreground mb-4 text-center">{subtitle}</p>
      )}
      <div className="h-[300px] w-full">
        <Pie data={processedData} options={mergedOptions} />
      </div>
    </div>
  )
}

export function LineChart({ data, options, className, title, subtitle }: LineChartProps) {
  // Apply default colors if not provided
  const processedData = {
    ...data,
    datasets: data.datasets.map((dataset, index) => ({
      ...dataset,
      borderColor: dataset.borderColor || chartColors[index % chartColors.length],
      backgroundColor: dataset.backgroundColor || chartColors[index % chartColors.length] + '20',
      tension: dataset.tension || 0.3,
      fill: dataset.fill !== undefined ? dataset.fill : true,
      pointBackgroundColor: dataset.borderColor || chartColors[index % chartColors.length],
      pointBorderColor: '#FFFFFF',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
    }))
  }

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    plugins: {
      ...defaultOptions.plugins,
      ...options?.plugins,
      title: title ? {
        display: true,
        text: title,
        color: '#1F2937',
        font: {
          family: 'Inter, sans-serif',
          size: 16,
          weight: 'bold' as const,
        },
        padding: 20,
      } : undefined,
    },
  }

  return (
    <div className={cn("w-full", className)}>
      {subtitle && (
        <p className="text-sm text-muted-foreground mb-4 text-center">{subtitle}</p>
      )}
      <div className="h-[300px] w-full">
        <Line data={processedData} options={mergedOptions} />
      </div>
    </div>
  )
}

// Simple statistics chart for quick metrics
interface StatsChartProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: {
    value: number
    label: string
    direction: 'up' | 'down' | 'neutral'
  }
  className?: string
  color?: 'primary' | 'success' | 'warning' | 'error'
}

export function StatsChart({
  title,
  value,
  subtitle,
  trend,
  className,
  color = 'primary'
}: StatsChartProps) {
  const colorClasses = {
    primary: 'text-blue-600 border-blue-200 bg-blue-50',
    success: 'text-green-600 border-green-200 bg-green-50',
    warning: 'text-amber-600 border-amber-200 bg-amber-50',
    error: 'text-red-600 border-red-200 bg-red-50',
  }

  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-600',
  }

  return (
    <div className={cn(
      "p-6 rounded-lg border-2",
      colorClasses[color],
      className
    )}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        {trend && (
          <div className={cn("text-sm", trendColors[trend.direction])}>
            <span className="font-medium">
              {trend.direction === 'up' ? '+' : trend.direction === 'down' ? '-' : ''}
              {Math.abs(trend.value)}%
            </span>
            <p className="text-xs text-gray-500">{trend.label}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Export Chart.js for custom implementations
export { ChartJS }