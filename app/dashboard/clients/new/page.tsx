import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import ClientForm from './client-form'
import { ensureUserRecord } from '@/lib/ensure-user-record'

async function addClient(formData: FormData) {
  'use server'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Ensure user record exists and get contractor_id
  const userRecord = await ensureUserRecord(supabase, user.id)

  const visitDate = formData.get('visit_date') as string || null

  // Determine status automatically based on visit_date
  // If visit_date is set, status should be 'lead/scheduled'
  // Otherwise, use the status from the form or default to 'lead'
  let status = formData.get('status') as string || 'lead'
  if (visitDate) {
    status = 'lead/scheduled'
  }

  const clientData = {
    contractor_id: userRecord.contractor_id,
    client_name: formData.get('client_name') as string,
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

  const { data: client, error } = await supabase
    .from('clients')
    .insert(clientData)
    .select()
    .single()

  if (error) {
    console.error('Error creating client:', error)
    return
  }

  revalidatePath('/dashboard/clients')
  redirect(`/dashboard/clients/${client.id}`)
}

export default function NewClientPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Add New Client</h1>
        <p className="mt-1 text-sm text-gray-600">
          Add a new client to your contact list
        </p>
      </div>

      <ClientForm createClientAction={addClient} />
    </div>
  )
}
