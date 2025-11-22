import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { formatPhoneNumber } from '@/lib/format-phone'
import { sendQuoteEmail } from '@/lib/email'
import EmailQuoteButton from '@/app/components/email-quote-button'

async function updateQuoteStatus(quoteId: string, status: string) {
  'use server'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  await supabase
    .from('quotes')
    .update({ status })
    .eq('id', quoteId)
    .eq('contractor_id', user.id)

  revalidatePath(`/dashboard/quotes/${quoteId}`)
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/quotes')
}

async function duplicateQuote(quoteId: string) {
  'use server'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get the existing quote
  const { data: originalQuote } = await supabase
    .from('quotes')
    .select('*')
    .eq('id', quoteId)
    .eq('contractor_id', user.id)
    .single()

  if (!originalQuote) {
    redirect('/dashboard/quotes')
  }

  // Get original quote items
  const { data: originalQuoteItems } = await supabase
    .from('quote_items')
    .select('*')
    .eq('quote_id', quoteId)
    .order('sort_order', { ascending: true })

  // Create a duplicate
  const { data: newQuote, error } = await supabase
    .from('quotes')
    .insert({
      contractor_id: originalQuote.contractor_id,
      client_id: originalQuote.client_id,
      quote_title: originalQuote.quote_title ? `${originalQuote.quote_title} (Copy)` : null,
      quote_summary: originalQuote.quote_summary,
      quote_description: null,
      quote_amount: originalQuote.quote_amount,
      date_quoted: new Date().toISOString().split('T')[0], // Use today's date
      valid_until: originalQuote.valid_until,
      status: 'pending',
      notes: originalQuote.notes,
    })
    .select()
    .single()

  if (error) {
    console.error('Error duplicating quote:', error)
    return
  }

  // Duplicate quote items
  if (newQuote && originalQuoteItems && originalQuoteItems.length > 0) {
    const itemsToInsert = originalQuoteItems.map((item) => ({
      quote_id: newQuote.id,
      name: item.name,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      sort_order: item.sort_order,
    }))

    await supabase.from('quote_items').insert(itemsToInsert)
  }

  // Get client info for message personalization
  const { data: client } = await supabase
    .from('clients')
    .select('client_name')
    .eq('id', originalQuote.client_id)
    .single()

  // Create automated message sequence for the new quote
  if (newQuote && client) {
    const dateQuoted = newQuote.date_quoted
    const messages = [
      {
        quote_id: newQuote.id,
        message_text: `Hi ${client.client_name}, thanks for considering us! I'll have your estimate ready soon.`,
        sequence_day: 1,
        scheduled_for: new Date(dateQuoted).toISOString(),
      },
      {
        quote_id: newQuote.id,
        message_text: `Hi ${client.client_name}, your estimate is ready. Have you had a chance to review it?`,
        sequence_day: 3,
        scheduled_for: new Date(new Date(dateQuoted).getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        quote_id: newQuote.id,
        message_text: `Hi ${client.client_name}, just checking in on the estimate. Do you have any questions I can answer?`,
        sequence_day: 5,
        scheduled_for: new Date(new Date(dateQuoted).getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        quote_id: newQuote.id,
        message_text: `Hi ${client.client_name}, wanted to follow up one more time. We'd love to work with you!`,
        sequence_day: 8,
        scheduled_for: new Date(new Date(dateQuoted).getTime() + 8 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        quote_id: newQuote.id,
        message_text: `Hi ${client.client_name}, this is my final follow-up about the estimate. If you'd like to move forward, just let me know!`,
        sequence_day: 12,
        scheduled_for: new Date(new Date(dateQuoted).getTime() + 12 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ]

    await supabase.from('messages').insert(messages)
  }

  revalidatePath('/dashboard/quotes')
  revalidatePath(`/dashboard/clients/${originalQuote.client_id}`)
  redirect(`/dashboard/quotes/${newQuote.id}`)
}

async function emailQuote(quoteId: string) {
  'use server'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user's contractor_id
  const { data: userRecord } = await supabase
    .from('users')
    .select('contractor_id')
    .eq('id', user.id)
    .single()

  if (!userRecord) {
    return { error: 'User not found' }
  }

  // Get quote with all details including client and contractor info
  const { data: quote } = await supabase
    .from('quotes')
    .select(`
      *,
      clients (
        client_name,
        client_email
      )
    `)
    .eq('id', quoteId)
    .eq('contractor_id', userRecord.contractor_id)
    .single()

  if (!quote) {
    return { error: 'Quote not found' }
  }

  if (!quote.clients?.client_email) {
    return { error: 'Client email address not found. Please add an email address to the client profile.' }
  }

  // Get quote items
  const { data: quoteItems } = await supabase
    .from('quote_items')
    .select('*')
    .eq('quote_id', quoteId)
    .order('sort_order', { ascending: true })

  // Get contractor info
  const { data: contractor } = await supabase
    .from('contractors')
    .select('company_name, name')
    .eq('id', userRecord.contractor_id)
    .single()

  if (!contractor) {
    return { error: 'Contractor information not found' }
  }

  // Get site URL from environment or use default
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  try {
    await sendQuoteEmail({
      to: quote.clients.client_email,
      quoteTitle: quote.quote_title,
      quoteSummary: quote.quote_summary,
      quoteDescription: quote.quote_description,
      quoteAmount: quote.quote_amount,
      clientName: quote.clients.client_name,
      companyName: contractor.company_name || contractor.name,
      dateQuoted: quote.date_quoted,
      validUntil: quote.valid_until,
      acceptanceToken: quote.acceptance_token,
      siteUrl: siteUrl,
      quoteItems: quoteItems || [],
    })

    // Update the quote with the timestamp when email was sent
    await supabase
      .from('quotes')
      .update({ last_emailed_at: new Date().toISOString() })
      .eq('id', quoteId)

    revalidatePath(`/dashboard/quotes/${quoteId}`)
    return { success: true }
  } catch (error) {
    console.error('Email send error:', error)
    return { error: 'Failed to send email. Please try again.' }
  }
}

export default async function QuoteDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const resolvedParams = await params

  // Get quote details with client information
  const { data: quote } = await supabase
    .from('quotes')
    .select(`
      *,
      clients (
        id,
        client_name,
        client_phone,
        client_email,
        client_address_street,
        client_address_city,
        client_address_state,
        client_address_zip,
        client_address_unit
      )
    `)
    .eq('id', resolvedParams.id)
    .eq('contractor_id', user.id)
    .single()

  if (!quote) {
    redirect('/dashboard/quotes')
  }

  // Get quote items
  const { data: quoteItems } = await supabase
    .from('quote_items')
    .select('*')
    .eq('quote_id', quote.id)
    .order('sort_order', { ascending: true })

  // Get messages for this quote
  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('quote_id', quote.id)
    .order('sequence_day', { ascending: true })

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/dashboard/quotes"
          className="text-sm text-blue-600 hover:text-blue-800 mb-4 inline-block"
        >
          ← Back to Quotes
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Quote for {quote.clients?.client_name}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              ${quote.quote_amount.toLocaleString()}
            </p>
          </div>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              quote.status === 'pending'
                ? 'bg-yellow-100 text-yellow-800'
                : quote.status === 'accepted'
                ? 'bg-green-100 text-green-800'
                : quote.status === 'rejected'
                ? 'bg-red-100 text-red-800'
                : quote.status === 'void'
                ? 'bg-gray-100 text-gray-800'
                : 'bg-blue-100 text-blue-800'
            }`}
          >
            {quote.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quote Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Client Information</h2>
              <Link
                href={`/dashboard/clients/${quote.clients?.id}`}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                View Client →
              </Link>
            </div>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{quote.clients?.client_name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Phone</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatPhoneNumber(quote.clients?.client_phone)}</dd>
              </div>
              {quote.clients?.client_email && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{quote.clients.client_email}</dd>
                </div>
              )}
              {quote.clients?.client_address_street && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Address</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {quote.clients.client_address_street}
                    {quote.clients.client_address_unit && `, ${quote.clients.client_address_unit}`}
                    <br />
                    {quote.clients.client_address_city && `${quote.clients.client_address_city}, `}
                    {quote.clients.client_address_state && `${quote.clients.client_address_state} `}
                    {quote.clients.client_address_zip}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Quote Information */}
          {(quote.quote_title || quote.quote_summary || quote.quote_description) && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Quote Information</h2>
              <div className="space-y-4">
                {quote.quote_title && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Title</dt>
                    <dd className="mt-1 text-base font-semibold text-gray-900">{quote.quote_title}</dd>
                  </div>
                )}
                {quote.quote_summary && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Summary</dt>
                    <dd className="mt-1 text-sm text-gray-900">{quote.quote_summary}</dd>
                  </div>
                )}
                {quote.quote_description && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 mb-2">Description</dt>
                    <dd
                      className="mt-1 text-sm text-gray-900 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: quote.quote_description }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quote Line Items */}
          {quoteItems && quoteItems.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Line Items</h2>
              <div className="space-y-4">
                {quoteItems.map((item, index) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-medium text-gray-700">{item.name}</span>
                      <span className="text-sm font-semibold text-gray-900">
                        ${(item.quantity * item.unit_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    {item.description && (
                      <div
                        className="text-sm text-gray-700 prose prose-sm max-w-none mb-3"
                        dangerouslySetInnerHTML={{ __html: item.description }}
                      />
                    )}
                    <div className="flex gap-4 text-xs text-gray-500">
                      <span>Qty: {item.quantity}</span>
                      <span>×</span>
                      <span>${item.unit_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} each</span>
                    </div>
                  </div>
                ))}
                <div className="border-t-2 border-gray-300 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Total</span>
                    <span className="text-2xl font-bold text-blue-600">
                      ${quote.quote_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quote Details */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Quote Details</h2>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Quote Amount</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  ${quote.quote_amount.toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Date Quoted</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(quote.date_quoted).toLocaleDateString()}
                </dd>
              </div>
              {quote.valid_until && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Valid Until</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(quote.valid_until).toLocaleDateString()}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(quote.created_at).toLocaleDateString()}
                </dd>
              </div>
              {quote.last_emailed_at && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Emailed</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <div className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{new Date(quote.last_emailed_at).toLocaleString()}</span>
                    </div>
                  </dd>
                </div>
              )}
              {quote.notes && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Internal Notes</dt>
                  <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{quote.notes}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Message Schedule */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Follow-up Messages</h2>
            {messages && messages.length > 0 ? (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className="border-l-4 border-gray-200 pl-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            Day {message.sequence_day}
                          </span>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              message.status === 'sent'
                                ? 'bg-green-100 text-green-800'
                                : message.status === 'failed'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {message.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{message.message_text}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {message.sent_at
                            ? `Sent: ${new Date(message.sent_at).toLocaleString()}`
                            : `Scheduled: ${new Date(message.scheduled_for).toLocaleString()}`}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No messages scheduled</p>
            )}
          </div>
        </div>

        {/* Actions Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Quote Actions</h2>
            <div className="space-y-3">
              <Link
                href={`/dashboard/quotes/${quote.id}/edit`}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Edit Quote
              </Link>
              <form action={duplicateQuote.bind(null, quote.id)} className="w-full">
                <button
                  type="submit"
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Duplicate Quote
                </button>
              </form>
              <EmailQuoteButton
                quoteId={quote.id}
                clientEmail={quote.clients?.client_email}
                lastEmailedAt={quote.last_emailed_at}
                onSend={emailQuote}
              />
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Status Actions</h2>
            <div className="space-y-3">
              {quote.status === 'pending' && (
                <>
                  <form action={updateQuoteStatus.bind(null, quote.id, 'accepted')} className="w-full">
                    <button
                      type="submit"
                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                    >
                      Mark as Accepted
                    </button>
                  </form>
                  <form action={updateQuoteStatus.bind(null, quote.id, 'rejected')} className="w-full">
                    <button
                      type="submit"
                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Mark as Rejected
                    </button>
                  </form>
                </>
              )}
              {quote.status !== 'pending' && quote.status !== 'void' && (
                <form action={updateQuoteStatus.bind(null, quote.id, 'pending')} className="w-full">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Mark as Pending
                  </button>
                </form>
              )}
              {quote.status !== 'void' && (
                <form action={updateQuoteStatus.bind(null, quote.id, 'void')} className="w-full">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Mark as Void
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
