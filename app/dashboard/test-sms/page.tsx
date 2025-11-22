'use client'

import { useState } from 'react'

export default function TestSMSPage() {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [message, setMessage] = useState('Test message from TextLoop!')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/messages/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: phoneNumber,
          message: message,
        }),
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ success: false, error: 'Failed to send test message' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Test SMS Sending</h1>
        <p className="mt-1 text-sm text-gray-600">
          Send a test SMS to verify your Twilio integration
        </p>
      </div>

      <div className="bg-white shadow rounded-lg p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Must be verified in Twilio if using trial account. Format: +1234567890
            </p>
            <input
              type="tel"
              id="phone"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              placeholder="+1234567890"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm text-gray-900"
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700">
              Message
            </label>
            <textarea
              id="message"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm text-gray-900"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : 'Send Test SMS'}
          </button>
        </form>

        {result && (
          <div className={`mt-6 p-4 rounded-md ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
            <h3 className={`text-sm font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
              {result.success ? '✓ Success!' : '✗ Failed'}
            </h3>
            <div className={`mt-2 text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
              {result.success ? (
                <>
                  <p>Message sent successfully!</p>
                  <p className="text-xs mt-1">Message ID: {result.messageId}</p>
                </>
              ) : (
                <>
                  <p>Error: {result.error}</p>
                </>
              )}
            </div>
            <pre className="mt-3 text-xs bg-white p-3 rounded border overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">Trial Account Notes:</h4>
          <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
            <li>Only verified phone numbers can receive messages</li>
            <li>Messages will have a trial notice prepended</li>
            <li>You have $15 in free credits</li>
            <li>Verify numbers at: console.twilio.com → Phone Numbers → Verified Caller IDs</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
