"use client"

import React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/components/providers/ThemeProvider"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark")
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="relative w-10 h-10 rounded-full bg-white/10 dark:bg-gray-800/50 backdrop-blur-xl border border-sage-200 dark:border-sage-800 hover:bg-white/20 dark:hover:bg-gray-700/50 transition-all shadow-lg"
      aria-label="Toggle theme"
    >
      <Sun className="h-5 w-5 text-sage-600 dark:text-sage-400 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 text-sage-600 dark:text-sage-400 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
