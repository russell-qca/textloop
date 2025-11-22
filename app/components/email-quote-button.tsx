'use client'

import { useState } from 'react'

interface EmailQuoteButtonProps {
  quoteId: string
  clientEmail: string | null
  lastEmailedAt: string | null
  onSend: (quoteId: string) => Promise<{ success?: boolean; error?: string }>
}

export default function EmailQuoteButton({
  quoteId,
  clientEmail,
  lastEmailedAt,
  onSend
}: EmailQuoteButtonProps) {
  const [isSending, setIsSending] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function handleSend() {
    setIsSending(true)
    setMessage(null)

    try {
      const result = await onSend(quoteId)

      if (result.success) {
        setMessage({ type: 'success', text: 'Quote emailed successfully!' })
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to send email' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to send email' })
    }

    setIsSending(false)

    // Clear success message after 5 seconds
    if (message?.type === 'success') {
      setTimeout(() => setMessage(null), 5000)
    }
  }

  return (
    <div>
      <button
        onClick={handleSend}
        disabled={!clientEmail || isSending}
        className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        title={!clientEmail ? 'Client email address required' : 'Send quote via email'}
      >
        <svg
          className="mr-2 -ml-1 h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
        {isSending ? 'Sending...' : lastEmailedAt ? 'Resend to Client' : 'Email to Client'}
      </button>

      {lastEmailedAt && !message && (
        <p className="mt-2 text-xs text-gray-600">
          Last sent: {new Date(lastEmailedAt).toLocaleDateString()} at {new Date(lastEmailedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      )}

      {!clientEmail && (
        <p className="mt-2 text-xs text-red-600">
          Client email address required. Add an email to the client profile.
        </p>
      )}

      {message && (
        <div
          className={`mt-3 p-3 rounded-md text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  )
}
