import { InputHTMLAttributes, forwardRef } from 'react'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className = '', ...props }, ref) {
    return (
      <input
        ref={ref}
        className={`w-full rounded-lg border border-sand-200 bg-white dark:bg-sand-100 px-3 py-2.5 text-base sm:text-sm text-ink placeholder:text-ink/30 outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:border-indigo-600 transition-colors ${className}`}
        {...props}
      />
    )
  }
)