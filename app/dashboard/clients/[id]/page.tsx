import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatPhoneNumber } from '@/lib/format-phone'

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const resolvedParams = await params

  // Get client details
  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', resolvedParams.id)
    .eq('contractor_id', user.id)
    .single()

  if (!client) {
    redirect('/dashboard/clients')
  }

  // Get quotes for this client (exclude voided)
  const { data: quotes } = await supabase
    .from('quotes')
    .select('*')
    .eq('client_id', client.id)
    .neq('status', 'void')
    .order('date_quoted', { ascending: false })

  // Get projects for this client
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('client_id', client.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/dashboard/clients"
          className="text-sm text-blue-600 hover:text-blue-800 mb-4 inline-block"
        >
          ← Back to Clients
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{client.first_name} {client.last_name}</h1>
            <p className="mt-1 text-sm text-gray-600">{formatPhoneNumber(client.client_phone)}</p>
          </div>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              client.status === 'lead'
                ? 'bg-yellow-100 text-yellow-800'
                : client.status === 'active'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {client.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h2>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Phone</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatPhoneNumber(client.client_phone)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{client.client_email || '-'}</dd>
              </div>
              {client.client_address_street && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Address</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {client.client_address_street}
                    {client.client_address_unit && `, ${client.client_address_unit}`}
                    <br />
                    {client.client_address_city && `${client.client_address_city}, `}
                    {client.client_address_state && `${client.client_address_state} `}
                    {client.client_address_zip}
                  </dd>
                </div>
              )}
              {client.notes && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Notes</dt>
                  <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{client.notes}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Lead Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Lead Information</h2>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {client.lead_date && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Lead Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(client.lead_date).toLocaleDateString()}
                  </dd>
                </div>
              )}
              {client.lead_origin && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Lead Origin</dt>
                  <dd className="mt-1 text-sm text-gray-900">{client.lead_origin}</dd>
                </div>
              )}
              {client.visit_date && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Visit Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(client.visit_date).toLocaleDateString()}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="mt-1">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      client.status === 'lead'
                        ? 'bg-yellow-100 text-yellow-800'
                        : client.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {client.status}
                  </span>
                </dd>
              </div>
            </dl>
          </div>

          {/* Quotes for this client */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Quotes</h2>
              <Link
                href={`/dashboard/quotes/new?client_id=${client.id}`}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                + Add Quote
              </Link>
            </div>
            {quotes && quotes.length > 0 ? (
              <div className="space-y-3">
                {quotes.map((quote) => (
                  <Link
                    key={quote.id}
                    href={`/dashboard/quotes/${quote.id}`}
                    className="block border rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {quote.quote_title || 'Untitled Quote'}
                        </div>
                        <div className="text-sm text-gray-900 mt-1">
                          ${quote.quote_amount.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(quote.date_quoted).toLocaleDateString()}
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          quote.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : quote.status === 'accepted'
                            ? 'bg-green-100 text-green-800'
                            : quote.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {quote.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No quotes yet</p>
            )}
          </div>

          {/* Projects for this client */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Projects</h2>
              <Link
                href={`/dashboard/projects/new?client_id=${client.id}`}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                + Add Project
              </Link>
            </div>
            {projects && projects.length > 0 ? (
              <div className="space-y-3">
                {projects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/dashboard/projects/${project.id}`}
                    className="block border rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {project.project_type}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-md">
                          {project.project_description}
                        </div>
                        {project.project_cost && (
                          <div className="text-sm text-gray-900 mt-1">
                            ${project.project_cost.toLocaleString()}
                          </div>
                        )}
                      </div>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          project.status === 'planned'
                            ? 'bg-blue-100 text-blue-800'
                            : project.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : project.status === 'completed'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {project.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No projects yet</p>
            )}
          </div>
        </div>

        {/* Actions Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Client Actions</h2>
            <div className="space-y-3">
              <Link
                href={`/dashboard/clients/${client.id}/edit`}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Edit Client
              </Link>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link
                href={`/dashboard/quotes/new?client_id=${client.id}`}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Create Quote
              </Link>
              <Link
                href={`/dashboard/projects/new?client_id=${client.id}`}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Create Project
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
