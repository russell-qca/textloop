import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatPhoneNumber } from '@/lib/format-phone'
import SearchFilter from '@/app/components/search-filter'
import { ensureUserRecord } from '@/lib/ensure-user-record'

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: { search?: string; status?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Ensure user record and get contractor_id
  const userRecord = await ensureUserRecord(supabase, user.id)

  // Await searchParams
  const resolvedSearchParams = await searchParams
  const searchTerm = resolvedSearchParams.search || ''
  const statusFilter = resolvedSearchParams.status?.split(',').filter(Boolean) || []

  // Build query with filters
  let query = supabase
    .from('clients')
    .select('*')
    .eq('contractor_id', userRecord.contractor_id)

  // Apply search filter
  if (searchTerm) {
    query = query.or(
      `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,client_phone.ilike.%${searchTerm}%,client_email.ilike.%${searchTerm}%,client_address_city.ilike.%${searchTerm}%`
    )
  }

  // Apply status filter
  if (statusFilter.length > 0) {
    query = query.in('status', statusFilter)
  }

  const { data: clients } = await query.order('created_at', { ascending: false })

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Clients</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your client contacts
          </p>
        </div>
        <Link
          href="/dashboard/clients/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          Add Client
        </Link>
      </div>

      {/* Search and Filter */}
      <SearchFilter
        placeholder="Search clients by name, phone, email, or location..."
        statusOptions={[
          { value: 'lead', label: 'Lead' },
          { value: 'lead/scheduled', label: 'Lead - Scheduled' },
          { value: 'lead/quote', label: 'Lead - Quote' },
          { value: 'active', label: 'Active' },
          { value: 'archived', label: 'Archived' },
        ]}
        statusLabel="Filter by Status"
      />

      {/* Clients Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        {clients && clients.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Phone
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Email
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Location
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">View</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {client.first_name} {client.last_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatPhoneNumber(client.client_phone)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {client.client_email || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {client.client_address_city && client.client_address_state
                        ? `${client.client_address_city}, ${client.client_address_state}`
                        : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        client.status === 'lead'
                          ? 'bg-yellow-100 text-yellow-800'
                          : client.status === 'lead/scheduled'
                          ? 'bg-purple-100 text-purple-800'
                          : client.status === 'lead/quote'
                          ? 'bg-amber-100 text-amber-800'
                          : client.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {client.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/dashboard/clients/${client.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-4 py-12 text-center">
            <p className="text-gray-500 mb-4">No clients yet</p>
            <Link
              href="/dashboard/clients/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Add Your First Client
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
