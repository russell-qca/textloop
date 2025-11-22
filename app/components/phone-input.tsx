'use client'

import { useState, useEffect } from 'react'

interface PhoneInputProps {
  name: string
  id?: string
  defaultValue?: string
  required?: boolean
  className?: string
  placeholder?: string
}

export default function PhoneInput({
  name,
  id,
  defaultValue = '',
  required = false,
  className = '',
  placeholder = '(555) 555-5555',
}: PhoneInputProps) {
  const [value, setValue] = useState('')

  useEffect(() => {
    // Format the default value on mount
    if (defaultValue) {
      setValue(formatPhoneNumber(defaultValue))
    }
  }, [defaultValue])

  const formatPhoneNumber = (input: string): string => {
    // Remove all non-numeric characters
    const cleaned = input.replace(/\D/g, '')

    // Limit to 10 digits
    const limited = cleaned.substring(0, 10)

    // Format based on length
    if (limited.length === 0) return ''
    if (limited.length <= 3) return `(${limited}`
    if (limited.length <= 6) return `(${limited.slice(0, 3)}) ${limited.slice(3)}`
    return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    const formatted = formatPhoneNumber(input)
    setValue(formatted)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow backspace to work naturally
    if (e.key === 'Backspace') {
      const cursorPosition = (e.target as HTMLInputElement).selectionStart || 0
      const currentValue = value

      // If cursor is right after a formatting character, delete it and the number before it
      if (cursorPosition > 0) {
        const charBefore = currentValue[cursorPosition - 1]
        if (charBefore === ' ' || charBefore === ')' || charBefore === '-') {
          e.preventDefault()
          const newValue = currentValue.slice(0, cursorPosition - 2) + currentValue.slice(cursorPosition)
          setValue(formatPhoneNumber(newValue))
        }
      }
    }
  }

  return (
    <input
      type="tel"
      name={name}
      id={id || name}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      required={required}
      className={className}
      placeholder={placeholder}
      maxLength={14} // (XXX) XXX-XXXX = 14 characters
    />
  )
}
