import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import ClientForm from '../../new/client-form'

async function updateClient(clientId: string, formData: FormData) {
  'use server'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const visitDate = formData.get('visit_date') as string || null

  // Check if client has any quotes
  const { data: quotes } = await supabase
    .from('quotes')
    .select('id')
    .eq('client_id', clientId)
    .limit(1)

  const hasQuotes = quotes && quotes.length > 0

  // Determine status automatically
  // Priority: visit_date > has quotes > manual status
  let status = formData.get('status') as string || 'lead'
  if (visitDate) {
    status = 'lead/scheduled'
  } else if (hasQuotes && status !== 'active' && status !== 'archived') {
    status = 'lead/quote'
  }

  const clientData = {
    first_name: formData.get('first_name') as string,
    last_name: formData.get('last_name') as string,
    client_phone: formData.get('client_phone') as string,
    client_email: formData.get('client_email') as string || null,
    client_address_street: formData.get('client_address_street') as string || null,
    client_address_city: formData.get('client_address_city') as string || null,
    client_address_state: formData.get('client_address_state') as string || null,
    client_address_zip: formData.get('client_address_zip') as string || null,
    client_address_unit: formData.get('client_address_unit') as string || null,
    lead_date: formData.get('lead_date') as string || null,
    lead_origin: formData.get('lead_origin') as string || null,
    visit_date: visitDate,
    status,
    notes: formData.get('notes') as string || null,
  }

  const { error } = await supabase
    .from('clients')
    .update(clientData)
    .eq('id', clientId)
    .eq('contractor_id', user.id)

  if (error) {
    console.error('Error updating client:', error)
    throw new Error(`Failed to update client: ${error.message}`)
  }

  revalidatePath(`/dashboard/clients/${clientId}`)
  revalidatePath('/dashboard/clients')
  redirect(`/dashboard/clients/${clientId}`)
}

export default async function EditClientPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const resolvedParams = await params

  // Get the existing client
  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', resolvedParams.id)
    .eq('contractor_id', user.id)
    .single()

  if (!client) {
    redirect('/dashboard/clients')
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Edit Client</h1>
        <p className="mt-1 text-sm text-gray-600">
          Update client information
        </p>
      </div>

      <ClientForm
        createClientAction={updateClient.bind(null, client.id)}
        existingClient={client}
        isEditing={true}
      />
    </div>
  )
}
