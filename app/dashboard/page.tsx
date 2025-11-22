import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import WeatherWidget from '@/app/components/weather-widget'
import { formatAddressForWeather } from '@/lib/weather'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Get user's contractor_id
  const { data: userRecord } = await supabase
    .from('users')
    .select('contractor_id')
    .eq('id', user.id)
    .single()

  if (!userRecord) return null

  const contractorId = userRecord.contractor_id

  // Get contractor info for weather
  const { data: contractor } = await supabase
    .from('contractors')
    .select('city, state')
    .eq('id', contractorId)
    .single()

  // Get quotes statistics
  const { data: quotes } = await supabase
    .from('quotes')
    .select('*')
    .eq('contractor_id', contractorId)

  const pendingQuotes = quotes?.filter(quote => quote.status === 'pending') || []
  const acceptedQuotes = quotes?.filter(quote => quote.status === 'accepted') || []
  const rejectedQuotes = quotes?.filter(quote => quote.status === 'rejected') || []

  // Calculate total value of accepted quotes
  const acceptedQuotesTotal = acceptedQuotes.reduce((sum, quote) => sum + (quote.quote_amount || 0), 0)

  // Get projects statistics
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('contractor_id', contractorId)

  const activeProjects = projects?.filter(project => project.status === 'active') || []
  const completedProjects = projects?.filter(project => project.status === 'completed') || []

  // Get recent activity (recent quotes)
  const { data: recentQuotes } = await supabase
    .from('quotes')
    .select(`
      *,
      clients (
        client_name
      )
    `)
    .eq('contractor_id', contractorId)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div>
      {/* Weather Widget */}
      {contractor?.city && contractor?.state && (
        <WeatherWidget
          address={formatAddressForWeather(
            null,
            contractor.city,
            contractor.state,
            null
          )}
        />
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Overview of your quotes, projects, and follow-ups
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        {/* Accepted Quotes Total Value - Featured Card */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 overflow-hidden shadow-lg rounded-lg border-2 border-green-200">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-green-800 truncate">
              Accepted Quotes Total
            </dt>
            <dd className="mt-1 text-3xl font-bold text-green-900">
              ${acceptedQuotesTotal.toLocaleString()}
            </dd>
            <p className="mt-2 text-xs text-green-700">
              {acceptedQuotes.length} accepted quote{acceptedQuotes.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Pending Quotes
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-yellow-600">
              {pendingQuotes.length}
            </dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Rejected Quotes
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-red-600">
              {rejectedQuotes.length}
            </dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Active Projects
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-blue-600">
              {activeProjects.length}
            </dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Completed Projects
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-600">
              {completedProjects.length}
            </dd>
          </div>
        </div>
      </div>

      {/* Recent Quotes */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Recent Quotes
          </h3>
          <Link
            href="/dashboard/quotes/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Add Quote
          </Link>
        </div>
        <div className="border-t border-gray-200">
          {recentQuotes && recentQuotes.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {recentQuotes.map((quote) => (
                <li key={quote.id}>
                  <Link
                    href={`/dashboard/quotes/${quote.id}`}
                    className="block hover:bg-gray-50"
                  >
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {quote.clients?.client_name}
                          </p>
                          <p className="text-sm text-gray-500">
                            ${quote.quote_amount.toLocaleString()} - {new Date(quote.date_quoted).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="ml-4 flex-shrink-0">
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
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
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
    </div>
  )
}
