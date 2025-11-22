import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import QuoteForm from '../../new/quote-form'

async function updateQuote(quoteId: string, formData: FormData) {
  'use server'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
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

  // Update the quote
  const { error: quoteError } = await supabase
    .from('quotes')
    .update({
      client_id: clientId,
      quote_title: quoteTitle,
      quote_summary: quoteSummary,
      quote_description: null,
      quote_amount: quoteAmount,
      date_quoted: dateQuoted,
      valid_until: validUntil,
      notes,
    })
    .eq('id', quoteId)
    .eq('contractor_id', user.id)

  if (quoteError) {
    console.error('Error updating quote:', quoteError)
    return
  }

  // Delete existing quote items
  await supabase
    .from('quote_items')
    .delete()
    .eq('quote_id', quoteId)

  // Insert new quote items
  if (quoteItems.length > 0) {
    const itemsToInsert = quoteItems.map((item: any) => ({
      quote_id: quoteId,
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

  revalidatePath(`/dashboard/quotes/${quoteId}`)
  revalidatePath('/dashboard/quotes')
  revalidatePath(`/dashboard/clients/${clientId}`)
  redirect(`/dashboard/quotes/${quoteId}`)
}

export default async function EditQuotePage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const resolvedParams = await params

  // Get the existing quote
  const { data: quote } = await supabase
    .from('quotes')
    .select('*')
    .eq('id', resolvedParams.id)
    .eq('contractor_id', user.id)
    .single()

  if (!quote) {
    redirect('/dashboard/quotes')
  }

  // Get existing quote items
  const { data: quoteItems } = await supabase
    .from('quote_items')
    .select('*')
    .eq('quote_id', resolvedParams.id)
    .order('sort_order', { ascending: true })

  // Get all clients for the dropdown
  const { data: clients } = await supabase
    .from('clients')
    .select('id, client_name, client_phone')
    .eq('contractor_id', user.id)
    .order('client_name', { ascending: true })

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Edit Quote</h1>
        <p className="mt-1 text-sm text-gray-600">
          Update quote details
        </p>
      </div>

      <QuoteForm
        clients={clients}
        preselectedClientId={quote.client_id}
        createQuoteAction={updateQuote.bind(null, quote.id)}
        existingQuote={quote}
        existingItems={quoteItems || []}
        isEditing={true}
      />
    </div>
  )
}
