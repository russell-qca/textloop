import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

async function createLead(formData: FormData) {
  'use server'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const visitDate = formData.get('visit_date') as string || null
  const quoteAmount = formData.get('quote_amount') ? parseFloat(formData.get('quote_amount') as string) : null

  // Determine status based on visit_date and quote_amount
  let status = 'active'
  if (visitDate) {
    status = 'lead/scheduled'
  } else if (quoteAmount) {
    status = 'lead/quote'
  }

  const leadData = {
    contractor_id: user.id,
    client_name: formData.get('client_name') as string,
    client_phone: formData.get('client_phone') as string,
    client_address_street: formData.get('client_address_street') as string || null,
    client_address_city: formData.get('client_address_city') as string || null,
    client_address_state: formData.get('client_address_state') as string || null,
    client_address_zip: formData.get('client_address_zip') as string || null,
    client_address_unit: formData.get('client_address_unit') as string || null,
    project_type: formData.get('project_type') as string,
    quote_amount: quoteAmount,
    visit_date: visitDate,
    date_quoted: formData.get('date_quoted') as string,
    status,
  }

  const { data: lead, error } = await supabase
    .from('leads')
    .insert(leadData)
    .select()
    .single()

  if (error) {
    console.error('Error creating lead:', error)
    return
  }

  // Create automated message sequence
  if (lead) {
    const messages = [
      {
        lead_id: lead.id,
        message_text: `Hi ${leadData.client_name}, thanks for considering us for your ${leadData.project_type} project! I'll have your estimate ready soon.`,
        sequence_day: 1,
        scheduled_for: new Date(leadData.date_quoted).toISOString(),
      },
      {
        lead_id: lead.id,
        message_text: `Hi ${leadData.client_name}, your estimate for the ${leadData.project_type} project is ready. Have you had a chance to review it?`,
        sequence_day: 3,
        scheduled_for: new Date(new Date(leadData.date_quoted).getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        lead_id: lead.id,
        message_text: `Hi ${leadData.client_name}, just checking in on the ${leadData.project_type} estimate. Do you have any questions I can answer?`,
        sequence_day: 5,
        scheduled_for: new Date(new Date(leadData.date_quoted).getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        lead_id: lead.id,
        message_text: `Hi ${leadData.client_name}, wanted to follow up one more time about your ${leadData.project_type} project. We'd love to work with you!`,
        sequence_day: 8,
        scheduled_for: new Date(new Date(leadData.date_quoted).getTime() + 8 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        lead_id: lead.id,
        message_text: `Hi ${leadData.client_name}, this is my final follow-up about the ${leadData.project_type} project. If you'd like to move forward, just let me know!`,
        sequence_day: 12,
        scheduled_for: new Date(new Date(leadData.date_quoted).getTime() + 12 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ]

    await supabase.from('messages').insert(messages)
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/leads')
  redirect('/dashboard/leads')
}

export default function NewLeadPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Add New Lead</h1>
        <p className="mt-1 text-sm text-gray-600">
          Add a new lead to start automated follow-ups
        </p>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <form action={createLead} className="space-y-6 p-6">
          {/* Client Information */}
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              Client Information
            </h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="client_name" className="block text-sm font-medium text-gray-700">
                  Client Name *
                </label>
                <input
                  type="text"
                  name="client_name"
                  id="client_name"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm text-gray-900"
                  placeholder="John Smith"
                />
              </div>

              <div>
                <label htmlFor="client_phone" className="block text-sm font-medium text-gray-700">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="client_phone"
                  id="client_phone"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm text-gray-900"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              Project Address
            </h3>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label htmlFor="client_address_street" className="block text-sm font-medium text-gray-700">
                  Street Address
                </label>
                <input
                  type="text"
                  name="client_address_street"
                  id="client_address_street"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm text-gray-900"
                  placeholder="123 Main St"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label htmlFor="client_address_unit" className="block text-sm font-medium text-gray-700">
                    Unit/Apt (Optional)
                  </label>
                  <input
                    type="text"
                    name="client_address_unit"
                    id="client_address_unit"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm text-gray-900"
                    placeholder="Apt 2B"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div>
                  <label htmlFor="client_address_city" className="block text-sm font-medium text-gray-700">
                    City
                  </label>
                  <input
                    type="text"
                    name="client_address_city"
                    id="client_address_city"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm text-gray-900"
                    placeholder="Austin"
                  />
                </div>

                <div>
                  <label htmlFor="client_address_state" className="block text-sm font-medium text-gray-700">
                    State
                  </label>
                  <input
                    type="text"
                    name="client_address_state"
                    id="client_address_state"
                    maxLength={2}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm text-gray-900"
                    placeholder="TX"
                  />
                </div>

                <div>
                  <label htmlFor="client_address_zip" className="block text-sm font-medium text-gray-700">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    name="client_address_zip"
                    id="client_address_zip"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm text-gray-900"
                    placeholder="78701"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Project Details */}
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              Project Details
            </h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="project_type" className="block text-sm font-medium text-gray-700">
                  Project Type *
                </label>
                <input
                  type="text"
                  name="project_type"
                  id="project_type"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm text-gray-900"
                  placeholder="Kitchen Remodel, HVAC Installation, etc."
                />
              </div>

              <div>
                <label htmlFor="quote_amount" className="block text-sm font-medium text-gray-700">
                  Quote Amount
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    name="quote_amount"
                    id="quote_amount"
                    step="0.01"
                    className="block w-full rounded-md border border-gray-300 pl-7 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm text-gray-900"
                    placeholder="5000.00"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="date_quoted" className="block text-sm font-medium text-gray-700">
                  Date Quoted *
                </label>
                <input
                  type="date"
                  name="date_quoted"
                  id="date_quoted"
                  required
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm text-gray-900"
                />
              </div>

              <div>
                <label htmlFor="visit_date" className="block text-sm font-medium text-gray-700">
                  Visit Date
                </label>
                <input
                  type="date"
                  name="visit_date"
                  id="visit_date"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm text-gray-900"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <a
              href="/dashboard/leads"
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </a>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Create Lead
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
