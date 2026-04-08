"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils/cn"
import { Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react"

const inputVariants = cva(
  "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "",
        error: "border-destructive focus-visible:ring-destructive",
        success: "border-success focus-visible:ring-success",
        warning: "border-warning focus-visible:ring-warning",
      },
      inputSize: {
        default: "h-10",
        sm: "h-9 px-2 text-xs",
        lg: "h-11 px-4",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "default",
    },
  }
)

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  error?: string
  success?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  showPasswordToggle?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, inputSize, type, error, success, leftIcon, rightIcon, showPasswordToggle, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)
    const [inputType, setInputType] = React.useState(type)

    React.useEffect(() => {
      if (showPasswordToggle && type === "password") {
        setInputType(showPassword ? "text" : "password")
      } else {
        setInputType(type)
      }
    }, [showPassword, type, showPasswordToggle])

    const effectiveVariant = error ? "error" : success ? "success" : variant

    const togglePasswordVisibility = () => {
      setShowPassword(!showPassword)
    }

    const hasLeftAddon = leftIcon
    const hasRightAddon = rightIcon || showPasswordToggle || error || success

    if (hasLeftAddon || hasRightAddon) {
      return (
        <div className="relative">
          {hasLeftAddon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </div>
          )}
          <input
            type={inputType}
            className={cn(
              inputVariants({ variant: effectiveVariant, inputSize, className }),
              hasLeftAddon && "pl-10",
              hasRightAddon && "pr-10"
            )}
            ref={ref}
            {...props}
          />
          {hasRightAddon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showPasswordToggle && type === "password" && (
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              )}
              {!showPasswordToggle && error && (
                <AlertCircle className="h-4 w-4 text-destructive" />
              )}
              {!showPasswordToggle && success && (
                <CheckCircle className="h-4 w-4 text-success" />
              )}
              {!showPasswordToggle && rightIcon && rightIcon}
            </div>
          )}
        </div>
      )
    }

    return (
      <input
        type={inputType}
        className={cn(inputVariants({ variant: effectiveVariant, inputSize, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input, inputVariants }