"use client"

import React from "react"
import { LucideIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils/cn"

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
  trend?: {
    value: number
    label: string
    isPositive?: boolean
  }
  variant?: "default" | "success" | "warning" | "error" | "info"
  className?: string
}

const variantStyles = {
  default: {
    iconBg: "bg-gray-100",
    iconColor: "text-gray-600",
    border: "border-gray-200"
  },
  success: {
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    border: "border-green-200"
  },
  warning: {
    iconBg: "bg-yellow-100",
    iconColor: "text-yellow-600",
    border: "border-yellow-200"
  },
  error: {
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    border: "border-red-200"
  },
  info: {
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    border: "border-blue-200"
  }
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  variant = "default",
  className
}: StatsCardProps) {
  const styles = variantStyles[variant]

  const formatValue = (val: string | number) => {
    if (typeof val === "number") {
      if (val >= 1000000) {
        return `${(val / 1000000).toFixed(1)}M`
      } else if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}K`
      }
      return val.toLocaleString()
    }
    return val
  }

  return (
    <Card className={cn("transition-all duration-200 hover:shadow-md", styles.border, className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <div className={cn("p-2 rounded-lg", styles.iconBg)}>
                <Icon className={cn("h-4 w-4", styles.iconColor)} />
              </div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
            </div>

            <div className="space-y-1">
              <p className="text-2xl font-bold text-gray-900">
                {formatValue(value)}
              </p>

              {description && (
                <p className="text-xs text-gray-500">{description}</p>
              )}

              {trend && (
                <div className="flex items-center space-x-1">
                  <Badge
                    variant={trend.isPositive ? "success" : "destructive"}
                    className="text-xs px-1.5 py-0.5"
                  >
                    {trend.isPositive ? "+" : ""}{trend.value}%
                  </Badge>
                  <span className="text-xs text-gray-500">{trend.label}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface StatsGridProps {
  stats: Array<{
    title: string
    value: string | number
    icon: LucideIcon
    description?: string
    trend?: {
      value: number
      label: string
      isPositive?: boolean
    }
    variant?: "default" | "success" | "warning" | "error" | "info"
  }>
  className?: string
}

export function StatsGrid({ stats, className }: StatsGridProps) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", className)}>
      {stats.map((stat, index) => (
        <StatsCard
          key={index}
          title={stat.title}
          value={stat.value}
          icon={stat.icon}
          description={stat.description}
          trend={stat.trend}
          variant={stat.variant}
        />
      ))}
    </div>
  )
}

export default StatsCard