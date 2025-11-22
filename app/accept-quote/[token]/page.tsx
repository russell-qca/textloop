import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

async function acceptQuote(token: string) {
  'use server'

  const supabase = await createClient()

  // Get quote by acceptance token
  const { data: quote } = await supabase
    .from('quotes')
    .select('id, status, contractor_id')
    .eq('acceptance_token', token)
    .single()

  if (!quote) {
    return { error: 'Quote not found' }
  }

  // Update quote status to accepted
  const { error } = await supabase
    .from('quotes')
    .update({ status: 'accepted' })
    .eq('id', quote.id)

  if (error) {
    return { error: 'Failed to accept quote' }
  }

  revalidatePath(`/dashboard/quotes/${quote.id}`)
  return { success: true }
}

async function rejectQuote(token: string) {
  'use server'

  const supabase = await createClient()

  // Get quote by acceptance token
  const { data: quote } = await supabase
    .from('quotes')
    .select('id, status, contractor_id')
    .eq('acceptance_token', token)
    .single()

  if (!quote) {
    return { error: 'Quote not found' }
  }

  // Update quote status to rejected
  const { error } = await supabase
    .from('quotes')
    .update({ status: 'rejected' })
    .eq('id', quote.id)

  if (error) {
    return { error: 'Failed to decline quote' }
  }

  revalidatePath(`/dashboard/quotes/${quote.id}`)
  return { success: true }
}

export default async function AcceptQuotePage({
  params,
}: {
  params: { token: string }
}) {
  const supabase = await createClient()
  const resolvedParams = await params

  // Get quote details by token (no auth required - public page)
  const { data: quoteData } = await supabase
    .from('quotes')
    .select(`
      id,
      quote_title,
      quote_summary,
      quote_description,
      quote_amount,
      date_quoted,
      valid_until,
      status,
      acceptance_token,
      contractor_id,
      client_id
    `)
    .eq('acceptance_token', resolvedParams.token)
    .single()

  let contractor = null
  let client = null

  if (quoteData) {
    const { data: contractorData } = await supabase
      .from('contractors')
      .select('company_name, name, phone')
      .eq('id', quoteData.contractor_id)
      .single()

    const { data: clientData } = await supabase
      .from('clients')
      .select('client_name')
      .eq('id', quoteData.client_id)
      .single()

    contractor = contractorData
    client = clientData
  }

  const quote = quoteData ? {
    ...quoteData,
    contractors: contractor,
    clients: client
  } : null

  // Get quote items
  let quoteItems = null
  if (quote) {
    const { data: items } = await supabase
      .from('quote_items')
      .select('*')
      .eq('quote_id', quote.id)
      .order('sort_order', { ascending: true })
    quoteItems = items
  }

  if (!quote) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Quote Not Found
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              This quote link is invalid or has expired.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const isExpired = quote.valid_until && new Date(quote.valid_until) < new Date()
  const isAlreadyAccepted = quote.status === 'accepted'
  const isRejected = quote.status === 'rejected'
  const isVoid = quote.status === 'void'

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {quote.contractors?.company_name || quote.contractors?.name}
          </h1>
          <p className="mt-2 text-lg text-gray-600">Quote Details</p>
        </div>

        {/* Quote Card */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Status Banner */}
          {isAlreadyAccepted && (
            <div className="bg-green-50 border-b border-green-200 px-6 py-4">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-green-800 font-medium">This quote has been accepted</span>
              </div>
            </div>
          )}
          {isRejected && (
            <div className="bg-red-50 border-b border-red-200 px-6 py-4">
              <span className="text-red-800 font-medium">This quote has been declined</span>
            </div>
          )}
          {isExpired && !isAlreadyAccepted && (
            <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-4">
              <span className="text-yellow-800 font-medium">This quote has expired</span>
            </div>
          )}

          {/* Quote Content */}
          <div className="px-6 py-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {quote.quote_title || 'Quote'}
              </h2>
              <p className="text-gray-600">For: {quote.clients?.client_name}</p>
            </div>

            {quote.quote_summary && (
              <p className="text-gray-700 mb-6">{quote.quote_summary}</p>
            )}

            {/* Line Items */}
            {quoteItems && quoteItems.length > 0 ? (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Quote Breakdown</h3>
                <div className="space-y-3">
                  {quoteItems.map((item, index) => (
                    <div key={item.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-gray-700">{item.name}</span>
                        <span className="text-sm font-semibold text-gray-900">
                          ${(item.quantity * item.unit_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      {item.description && (
                        <div
                          className="text-sm text-gray-700 mb-2"
                          dangerouslySetInnerHTML={{ __html: item.description }}
                        />
                      )}
                      <div className="flex gap-3 text-xs text-gray-500">
                        <span>Quantity: {item.quantity}</span>
                        <span>×</span>
                        <span>${item.unit_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} each</span>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Total Amount */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mt-4">
                  <div className="flex justify-between items-center">
                    <div className="text-lg font-semibold text-gray-900">Total Quote Amount</div>
                    <div className="text-3xl font-bold text-blue-600">
                      ${quote.quote_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Amount (fallback for quotes without line items) */
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <div className="text-sm text-gray-600 mb-1">Quote Amount</div>
                <div className="text-4xl font-bold text-blue-600">
                  ${quote.quote_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            )}

            {/* Details */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <div className="text-sm text-gray-600">Date Quoted</div>
                <div className="text-gray-900">
                  {new Date(quote.date_quoted).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
              {quote.valid_until && (
                <div>
                  <div className="text-sm text-gray-600">Valid Until</div>
                  <div className="text-gray-900">
                    {new Date(quote.valid_until).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            {quote.quote_description && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
                <div
                  className="bg-gray-50 rounded-lg p-4 text-gray-700"
                  dangerouslySetInnerHTML={{ __html: quote.quote_description }}
                />
              </div>
            )}

            {/* Accept/Decline Buttons */}
            {!isAlreadyAccepted && !isRejected && !isVoid && !isExpired && (
              <div className="grid grid-cols-2 gap-4">
                <form action={rejectQuote.bind(null, resolvedParams.token)}>
                  <button
                    type="submit"
                    className="w-full bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                  >
                    Decline Quote
                  </button>
                </form>
                <form action={acceptQuote.bind(null, resolvedParams.token)}>
                  <button
                    type="submit"
                    className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    Accept Quote
                  </button>
                </form>
              </div>
            )}

            {isAlreadyAccepted && (
              <div className="bg-green-100 text-green-800 px-6 py-3 rounded-lg text-center font-medium">
                Thank you! We'll be in touch soon.
              </div>
            )}

            {isRejected && (
              <div className="bg-gray-100 text-gray-800 px-6 py-3 rounded-lg text-center font-medium">
                You have declined this quote.
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              Questions? Contact {quote.contractors?.company_name || quote.contractors?.name}
              {quote.contractors?.phone && (
                <> at <a href={`tel:${quote.contractors.phone}`} className="text-blue-600 hover:underline">{quote.contractors.phone}</a></>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
