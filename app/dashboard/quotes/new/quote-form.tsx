'use client'

import { useState, useEffect } from 'react'
import QuoteItemEditor, { QuoteItem } from '@/app/components/quote-item-editor'
import { formatPhoneNumber } from '@/lib/format-phone'

interface Client {
  id: string
  first_name: string
  last_name: string
  client_phone: string
}

interface ExistingQuote {
  quote_title: string | null
  quote_summary: string | null
  quote_description: string | null
  quote_amount: number
  date_quoted: string
  valid_until: string | null
  notes: string | null
}

interface QuoteFormProps {
  clients: Client[] | null
  preselectedClientId?: string
  createQuoteAction: (formData: FormData) => Promise<void>
  existingQuote?: ExistingQuote
  existingItems?: QuoteItem[]
  isEditing?: boolean
}

export default function QuoteForm({
  clients,
  preselectedClientId,
  createQuoteAction,
  existingQuote,
  existingItems = [],
  isEditing = false
}: QuoteFormProps) {
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>(existingItems)
  const today = new Date().toISOString().split('T')[0]
  const [dateQuoted, setDateQuoted] = useState(existingQuote?.date_quoted || today)

  // Calculate initial valid_until (30 days from today for new quotes)
  const getInitialValidUntil = () => {
    if (existingQuote?.valid_until) return existingQuote.valid_until
    const date = new Date()
    date.setDate(date.getDate() + 30)
    return date.toISOString().split('T')[0]
  }

  const [validUntil, setValidUntil] = useState(getInitialValidUntil())

  // Auto-set valid_until to 30 days after date_quoted when date changes
  useEffect(() => {
    if (dateQuoted && !isEditing) {
      const date = new Date(dateQuoted)
      date.setDate(date.getDate() + 30)
      setValidUntil(date.toISOString().split('T')[0])
    }
  }, [dateQuoted, isEditing])

  // Calculate total from items
  const calculateTotal = () => {
    return quoteItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0)
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const formData = new FormData(e.currentTarget)

    // Add quote items to form data as JSON
    formData.set('quote_items', JSON.stringify(quoteItems))

    // Set quote_amount to calculated total
    formData.set('quote_amount', calculateTotal().toString())

    createQuoteAction(formData)
  }

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <form onSubmit={handleSubmit} className="space-y-6 p-6">
        {/* Client Selection */}
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
            Client Selection
          </h3>
          <div>
            <label htmlFor="client_id" className="block text-sm font-medium text-gray-700">
              Select Client *
            </label>
            {clients && clients.length > 0 ? (
              <div className="mt-1">
                <select
                  name="client_id"
                  id="client_id"
                  required
                  defaultValue={preselectedClientId || ''}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm text-gray-900"
                >
                  <option value="">Select a client...</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.first_name} {client.last_name} - {formatPhoneNumber(client.client_phone)}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-sm text-gray-500">
                  Don't see the client?{' '}
                  <a href="/dashboard/clients/new" className="text-blue-600 hover:text-blue-800">
                    Add a new client first
                  </a>
                </p>
              </div>
            ) : (
              <div className="mt-1 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  You need to add a client first before creating a quote.
                </p>
                <a
                  href="/dashboard/clients/new"
                  className="mt-2 inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                >
                  Add Client →
                </a>
              </div>
            )}
          </div>
        </div>

        {clients && clients.length > 0 && (
          <>
            {/* Quote Information */}
            <div>
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                Quote Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="quote_title" className="block text-sm font-medium text-gray-700">
                    Quote Title
                  </label>
                  <input
                    type="text"
                    name="quote_title"
                    id="quote_title"
                    defaultValue={existingQuote?.quote_title || ''}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm text-gray-900"
                    placeholder="e.g., Kitchen Remodel - Full Renovation"
                  />
                </div>

                <div>
                  <label htmlFor="quote_summary" className="block text-sm font-medium text-gray-700">
                    Quote Summary (Optional)
                  </label>
                  <textarea
                    name="quote_summary"
                    id="quote_summary"
                    rows={2}
                    defaultValue={existingQuote?.quote_summary || ''}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm text-gray-900"
                    placeholder="Brief summary of the work to be done..."
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Add details to individual line items below
                  </p>
                </div>
              </div>
            </div>

            {/* Quote Items */}
            <div>
              <QuoteItemEditor items={quoteItems} onChange={setQuoteItems} />
            </div>

            {/* Quote Details */}
            <div>
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                Quote Details
              </h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="date_quoted" className="block text-sm font-medium text-gray-700">
                    Date Quoted *
                  </label>
                  <input
                    type="date"
                    name="date_quoted"
                    id="date_quoted"
                    required
                    value={dateQuoted}
                    onChange={(e) => setDateQuoted(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm text-gray-900"
                  />
                </div>

                <div>
                  <label htmlFor="valid_until" className="block text-sm font-medium text-gray-700">
                    Valid Until
                  </label>
                  <input
                    type="date"
                    name="valid_until"
                    id="valid_until"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm text-gray-900"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Defaults to 30 days after date quoted
                  </p>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                Internal Notes
              </h3>
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Additional Notes (Internal Only)
                </label>
                <textarea
                  name="notes"
                  id="notes"
                  rows={4}
                  defaultValue={existingQuote?.notes || ''}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm text-gray-900"
                  placeholder="Any internal notes about this quote (not visible to client)..."
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <a
                href="/dashboard/quotes"
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </a>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                {isEditing ? 'Update Quote' : 'Create Quote'}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  )
}
