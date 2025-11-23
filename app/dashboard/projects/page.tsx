import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import SearchFilter from '@/app/components/search-filter'
import { ensureUserRecord } from '@/lib/ensure-user-record'

export default async function ProjectsPage({
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
    .from('projects')
    .select(`
      *,
      clients (
        first_name,
        last_name,
        client_phone
      )
    `)
    .eq('contractor_id', userRecord.contractor_id)

  // Apply status filter
  if (statusFilter.length > 0) {
    query = query.in('status', statusFilter)
  }

  const { data: allProjects } = await query.order('created_at', { ascending: false })

  // Apply search filter in JavaScript (to include client fields)
  const projects = allProjects?.filter((project) => {
    if (!searchTerm) return true

    const term = searchTerm.toLowerCase()
    const type = project.project_type?.toLowerCase() || ''
    const description = project.project_description?.toLowerCase() || ''
    const street = project.project_address_street?.toLowerCase() || ''
    const city = project.project_address_city?.toLowerCase() || ''
    const clientFirstName = project.clients?.first_name?.toLowerCase() || ''
    const clientLastName = project.clients?.last_name?.toLowerCase() || ''
    const clientPhone = project.clients?.client_phone?.toLowerCase() || ''

    return type.includes(term) ||
           description.includes(term) ||
           street.includes(term) ||
           city.includes(term) ||
           clientFirstName.includes(term) ||
           clientLastName.includes(term) ||
           clientPhone.includes(term)
  }) || []

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Projects</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your active and completed projects
          </p>
        </div>
        <Link
          href="/dashboard/projects/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          Add Project
        </Link>
      </div>

      {/* Search and Filter */}
      <SearchFilter
        placeholder="Search projects by type, description, location, client name, or phone..."
        statusOptions={[
          { value: 'planned', label: 'Planned' },
          { value: 'in_progress', label: 'In Progress' },
          { value: 'completed', label: 'Completed' },
          { value: 'cancelled', label: 'Cancelled' },
        ]}
        statusLabel="Filter by Status"
      />

      {/* Projects Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        {projects && projects.length > 0 ? (
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
                  Project Type
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Cost
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Start Date
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
              {projects.map((project) => (
                <tr key={project.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {project.clients?.first_name} {project.clients?.last_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {project.clients?.client_phone}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{project.project_type}</div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">
                      {project.project_description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {project.project_cost ? `$${project.project_cost.toLocaleString()}` : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {project.start_date ? new Date(project.start_date).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
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
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={`/dashboard/projects/${project.id}`}
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
            <p className="text-gray-500 mb-4">No projects yet</p>
            <Link
              href="/dashboard/projects/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Create Your First Project
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
