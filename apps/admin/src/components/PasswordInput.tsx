'use client'

import { useState, type InputHTMLAttributes } from 'react'
import { IconEye, IconEyeOff } from '@tabler/icons-react'
import { Input } from '@bitvora/ui/src/Input'

// A password field with a show/hide toggle, so merchants can check what they
// typed on a phone keyboard.
export function PasswordInput({ className = '', ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <Input {...props} type={visible ? 'text' : 'password'} className={`pr-11 ${className}`} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-ink/40 hover:text-ink rounded-md"
      >
        {visible ? <IconEyeOff className="w-4 h-4" stroke={1.75} /> : <IconEye className="w-4 h-4" stroke={1.75} />}
      </button>
    </div>
  )
}
