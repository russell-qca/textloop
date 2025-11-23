import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import QuoteForm from './quote-form'

async function createQuote(formData: FormData) {
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
    throw new Error('User not found')
  }

  const clientId = formData.get('client_id') as string
  const quoteTitle = formData.get('quote_title') as string || null
  const quoteSummary = formData.get('quote_summary') as string || null
  const quoteAmount = parseFloat(formData.get('quote_amount') as string)
  const dateQuoted = formData.get('date_quoted') as string
  const validUntil = formData.get('valid_until') as string || null
  const notes = formData.get('notes') as string || null
  const quoteItemsJson = formData.get('quote_items') as string

  // Parse quote items
  let quoteItems = []
  try {
    quoteItems = JSON.parse(quoteItemsJson || '[]')
  } catch (e) {
    console.error('Error parsing quote items:', e)
  }

  // Create the quote
  const { data: quote, error: quoteError } = await supabase
    .from('quotes')
    .insert({
      contractor_id: userRecord.contractor_id,
      client_id: clientId,
      quote_title: quoteTitle,
      quote_summary: quoteSummary,
      quote_description: null,
      quote_amount: quoteAmount,
      date_quoted: dateQuoted,
      valid_until: validUntil,
      status: 'pending',
      notes,
    })
    .select()
    .single()

  if (quoteError) {
    console.error('Error creating quote:', quoteError)
    return
  }

  // Insert quote items
  if (quote && quoteItems.length > 0) {
    const itemsToInsert = quoteItems.map((item: any) => ({
      quote_id: quote.id,
      name: item.name || 'Item',
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      sort_order: item.sort_order,
    }))

    const { error: itemsError } = await supabase
      .from('quote_items')
      .insert(itemsToInsert)

    if (itemsError) {
      console.error('Error creating quote items:', itemsError)
    }
  }

  // Get client info for message personalization and status update
  const { data: client } = await supabase
    .from('clients')
    .select('first_name, visit_date, status')
    .eq('id', clientId)
    .single()

  // Update client status to 'lead/quote' if they don't have a visit scheduled
  if (client && !client.visit_date && client.status !== 'lead/scheduled') {
    await supabase
      .from('clients')
      .update({ status: 'lead/quote' })
      .eq('id', clientId)
  }

  // Create automated message sequence for the quote
  if (quote && client) {
    const messages = [
      {
        quote_id: quote.id,
        message_text: `Hi ${client.first_name}, thanks for considering us! I'll have your estimate ready soon.`,
        sequence_day: 1,
        scheduled_for: new Date(dateQuoted).toISOString(),
      },
      {
        quote_id: quote.id,
        message_text: `Hi ${client.first_name}, your estimate is ready. Have you had a chance to review it?`,
        sequence_day: 3,
        scheduled_for: new Date(new Date(dateQuoted).getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        quote_id: quote.id,
        message_text: `Hi ${client.first_name}, just checking in on the estimate. Do you have any questions I can answer?`,
        sequence_day: 5,
        scheduled_for: new Date(new Date(dateQuoted).getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        quote_id: quote.id,
        message_text: `Hi ${client.first_name}, wanted to follow up one more time. We'd love to work with you!`,
        sequence_day: 8,
        scheduled_for: new Date(new Date(dateQuoted).getTime() + 8 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        quote_id: quote.id,
        message_text: `Hi ${client.first_name}, this is my final follow-up about the estimate. If you'd like to move forward, just let me know!`,
        sequence_day: 12,
        scheduled_for: new Date(new Date(dateQuoted).getTime() + 12 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ]

    await supabase.from('messages').insert(messages)
  }

  revalidatePath('/dashboard/quotes')
  revalidatePath(`/dashboard/clients/${clientId}`)
  redirect(`/dashboard/quotes/${quote.id}`)
}

export default async function NewQuotePage({
  searchParams,
}: {
  searchParams: { client_id?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const resolvedSearchParams = await searchParams
  const preselectedClientId = resolvedSearchParams.client_id

  // Get all clients for the dropdown
  const { data: clients } = await supabase
    .from('clients')
    .select('id, first_name, last_name, client_phone')
    .eq('contractor_id', user.id)
    .order('first_name', { ascending: true })

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Create New Quote</h1>
        <p className="mt-1 text-sm text-gray-600">
          Create a quote for a client and start automated follow-ups
        </p>
      </div>

      <QuoteForm
        clients={clients}
        preselectedClientId={preselectedClientId}
        createQuoteAction={createQuote}
      />
    </div>
  )
}
