"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "@/lib/utils/cn"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

// Enhanced tabs components for voting system
interface VotingTabsProps {
  tabs: Array<{
    id: string
    label: string
    content: React.ReactNode
    disabled?: boolean
    badge?: string | number
  }>
  defaultValue?: string
  className?: string
  orientation?: "horizontal" | "vertical"
}

export function VotingTabs({
  tabs,
  defaultValue,
  className,
  orientation = "horizontal"
}: VotingTabsProps) {
  return (
    <Tabs
      defaultValue={defaultValue || tabs[0]?.id}
      orientation={orientation}
      className={cn("w-full", className)}
    >
      <TabsList className={cn(
        orientation === "vertical" ? "flex-col h-auto space-y-1 w-48" : "grid w-full",
        orientation === "horizontal" && `grid-cols-${Math.min(tabs.length, 6)}`
      )}>
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            disabled={tab.disabled}
            className={cn(
              orientation === "vertical" ? "w-full justify-start" : "",
              "relative"
            )}
          >
            {tab.label}
            {tab.badge && (
              <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs">
                {tab.badge}
              </span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map((tab) => (
        <TabsContent key={tab.id} value={tab.id} className="mt-4">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  )
}

interface ElectionTabsProps {
  electionId: string
  tabs: Array<{
    id: 'overview' | 'candidates' | 'results' | 'analytics' | 'settings'
    label: string
    content: React.ReactNode
    count?: number
    disabled?: boolean
  }>
  className?: string
}

export function ElectionTabs({ electionId, tabs, className }: ElectionTabsProps) {
  return (
    <div className={cn("w-full", className)}>
      <Tabs defaultValue={tabs[0]?.id} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              disabled={tab.disabled}
              className="relative"
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs">
                  {tab.count}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="mt-6">
            {tab.content}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

interface AdminDashboardTabsProps {
  tabs: Array<{
    id: 'overview' | 'elections' | 'users' | 'candidates' | 'analytics' | 'system'
    label: string
    content: React.ReactNode
    notification?: boolean
    count?: number
  }>
  className?: string
}

export function AdminDashboardTabs({ tabs, className }: AdminDashboardTabsProps) {
  return (
    <div className={cn("w-full", className)}>
      <Tabs defaultValue={tabs[0]?.id} className="w-full">
        <TabsList className="w-full justify-start h-12 p-1">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="relative data-[state=active]:bg-background"
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-2 rounded-full bg-blue-100 text-blue-800 px-2 py-0.5 text-xs font-medium">
                  {tab.count}
                </span>
              )}
              {tab.notification && (
                <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500"></span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="mt-6">
            {tab.content}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }