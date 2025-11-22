import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import SearchFilter from '@/app/components/search-filter'
import { ensureUserRecord } from '@/lib/ensure-user-record'

export default async function QuotesPage({
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
    .from('quotes')
    .select(`
      *,
      clients (
        client_name,
        client_phone
      )
    `)
    .eq('contractor_id', userRecord.contractor_id)

  // Apply status filter
  if (statusFilter.length > 0) {
    query = query.in('status', statusFilter)
  }

  const { data: allQuotes } = await query.order('created_at', { ascending: false })

  // Apply search filter in JavaScript (to include client fields)
  const quotes = allQuotes?.filter((quote) => {
    if (!searchTerm) return true

    const term = searchTerm.toLowerCase()
    const title = quote.quote_title?.toLowerCase() || ''
    const summary = quote.quote_summary?.toLowerCase() || ''
    const clientName = quote.clients?.client_name?.toLowerCase() || ''
    const clientPhone = quote.clients?.client_phone?.toLowerCase() || ''

    return title.includes(term) ||
           summary.includes(term) ||
           clientName.includes(term) ||
           clientPhone.includes(term)
  }) || []

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Quotes</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your quotes and follow-up campaigns
          </p>
        </div>
        <Link
          href="/dashboard/quotes/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          Add Quote
        </Link>
      </div>

      {/* Search and Filter */}
      <SearchFilter
        placeholder="Search quotes by title, description, client name, or phone..."
        statusOptions={[
          { value: 'draft', label: 'Draft' },
          { value: 'pending', label: 'Pending' },
          { value: 'accepted', label: 'Accepted' },
          { value: 'rejected', label: 'Rejected' },
          { value: 'void', label: 'Void' },
        ]}
        statusLabel="Filter by Status"
      />

      {/* Quotes Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        {quotes && quotes.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Client
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Quote
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Amount
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Date Quoted
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
              {quotes.map((quote) => (
                <tr key={quote.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {quote.clients?.client_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {quote.clients?.client_phone}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {quote.quote_title || 'Untitled Quote'}
                    </div>
                    {quote.quote_summary && (
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {quote.quote_summary}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      ${quote.quote_amount.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(quote.date_quoted).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
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
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/dashboard/quotes/${quote.id}`}
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
            <p className="text-gray-500 mb-4">No quotes yet</p>
            <Link
              href="/dashboard/quotes/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Create Your First Quote
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
