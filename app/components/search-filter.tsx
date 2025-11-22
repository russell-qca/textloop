'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useTransition } from 'react'

interface StatusOption {
  value: string
  label: string
}

interface SearchFilterProps {
  placeholder?: string
  statusOptions?: StatusOption[]
  statusLabel?: string
}

export default function SearchFilter({
  placeholder = 'Search...',
  statusOptions = [],
  statusLabel = 'Status'
}: SearchFilterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(name, value)
      } else {
        params.delete(name)
      }
      return params.toString()
    },
    [searchParams]
  )

  const handleSearch = (term: string) => {
    startTransition(() => {
      router.push(pathname + '?' + createQueryString('search', term))
    })
  }

  const handleStatusToggle = (status: string) => {
    startTransition(() => {
      const currentStatuses = searchParams.get('status')?.split(',').filter(Boolean) || []
      const newStatuses = currentStatuses.includes(status)
        ? currentStatuses.filter(s => s !== status)
        : [...currentStatuses, status]

      router.push(pathname + '?' + createQueryString('status', newStatuses.join(',')))
    })
  }

  const selectedStatuses = searchParams.get('status')?.split(',').filter(Boolean) || []

  return (
    <div className="mb-6 space-y-4">
      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          placeholder={placeholder}
          defaultValue={searchParams.get('search') || ''}
          onChange={(e) => handleSearch(e.target.value)}
          className="block w-full rounded-md border border-gray-300 px-4 py-2 pl-10 text-sm focus:border-blue-500 focus:ring-blue-500"
        />
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <svg
            className="h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Status Filter Chips */}
      {statusOptions.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {statusLabel}:
          </label>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((option) => {
              const isSelected = selectedStatuses.includes(option.value)
              return (
                <button
                  key={option.value}
                  onClick={() => handleStatusToggle(option.value)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                  {isSelected && (
                    <span className="ml-1.5">×</span>
                  )}
                </button>
              )
            })}
          </div>
          {selectedStatuses.length > 0 && (
            <button
              onClick={() => {
                startTransition(() => {
                  router.push(pathname + '?' + createQueryString('status', ''))
                })
              }}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  )
}
