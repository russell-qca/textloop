import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'

async function updateLeadStatus(leadId: string, status: string) {
  'use server'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  await supabase
    .from('leads')
    .update({ status })
    .eq('id', leadId)
    .eq('contractor_id', user.id)

  revalidatePath(`/dashboard/leads/${leadId}`)
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/leads')
}

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const resolvedParams = await params

  // Get lead details
  const { data: lead } = await supabase
    .from('leads')
    .select('*')
    .eq('id', resolvedParams.id)
    .eq('contractor_id', user.id)
    .single()

  if (!lead) {
    redirect('/dashboard/leads')
  }

  // Get messages for this lead
  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('lead_id', lead.id)
    .order('sequence_day', { ascending: true })

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/dashboard/leads"
          className="text-sm text-blue-600 hover:text-blue-800 mb-4 inline-block"
        >
          ← Back to Leads
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{lead.client_name}</h1>
            <p className="mt-1 text-sm text-gray-600">{lead.project_type}</p>
          </div>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              lead.status === 'active'
                ? 'bg-blue-100 text-blue-800'
                : lead.status === 'won'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {lead.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h2>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Phone</dt>
                <dd className="mt-1 text-sm text-gray-900">{lead.client_phone}</dd>
              </div>
              {lead.client_address_street && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Address</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {lead.client_address_street}
                    {lead.client_address_unit && `, ${lead.client_address_unit}`}
                    <br />
                    {lead.client_address_city && `${lead.client_address_city}, `}
                    {lead.client_address_state && `${lead.client_address_state} `}
                    {lead.client_address_zip}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Project Details */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Project Details</h2>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Project Type</dt>
                <dd className="mt-1 text-sm text-gray-900">{lead.project_type}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Quote Amount</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {lead.quote_amount ? `$${lead.quote_amount.toLocaleString()}` : '-'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Date Quoted</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(lead.date_quoted).toLocaleDateString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(lead.created_at).toLocaleDateString()}
                </dd>
              </div>
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
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Actions</h2>
            <div className="space-y-3">
              {lead.status === 'active' && (
                <>
                  <form action={updateLeadStatus.bind(null, lead.id, 'won')} className="w-full">
                    <button
                      type="submit"
                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                    >
                      Mark as Won
                    </button>
                  </form>
                  <form action={updateLeadStatus.bind(null, lead.id, 'lost')} className="w-full">
                    <button
                      type="submit"
                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Mark as Lost
                    </button>
                  </form>
                </>
              )}
              {lead.status !== 'active' && (
                <form action={updateLeadStatus.bind(null, lead.id, 'active')} className="w-full">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Reactivate Lead
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
