import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { ensureUserRecord } from '@/lib/ensure-user-record'
import SearchFilter from '@/app/components/search-filter'

async function updateUserRole(userId: string, role: string) {
  'use server'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get current user's role and contractor_id
  const { data: currentUser } = await supabase
    .from('users')
    .select('role, contractor_id')
    .eq('id', user.id)
    .single()

  if (!currentUser || !['owner', 'admin'].includes(currentUser.role)) {
    throw new Error('Insufficient permissions')
  }

  // Update the user's role
  const { error } = await supabase
    .from('users')
    .update({ role })
    .eq('id', userId)
    .eq('contractor_id', currentUser.contractor_id)

  if (error) {
    throw new Error(`Failed to update user role: ${error.message}`)
  }

  revalidatePath('/dashboard/team')
}

async function removeTeamMember(userId: string) {
  'use server'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get current user's role and contractor_id
  const { data: currentUser } = await supabase
    .from('users')
    .select('role, contractor_id')
    .eq('id', user.id)
    .single()

  if (!currentUser || currentUser.role !== 'owner') {
    throw new Error('Only owners can remove team members')
  }

  // Prevent removing the last owner
  const { data: owners } = await supabase
    .from('users')
    .select('id')
    .eq('contractor_id', currentUser.contractor_id)
    .eq('role', 'owner')

  if (owners && owners.length <= 1) {
    const { data: userToRemove } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (userToRemove?.role === 'owner') {
      throw new Error('Cannot remove the last owner')
    }
  }

  // Delete the user
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId)
    .eq('contractor_id', currentUser.contractor_id)

  if (error) {
    throw new Error(`Failed to remove team member: ${error.message}`)
  }

  revalidatePath('/dashboard/team')
}

export default async function TeamPage({
  searchParams,
}: {
  searchParams: { search?: string; status?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Ensure user record exists and get current user's info
  const currentUser = await ensureUserRecord(supabase, user.id)

  // Await searchParams
  const resolvedSearchParams = await searchParams
  const searchTerm = resolvedSearchParams.search || ''
  const roleFilter = resolvedSearchParams.status?.split(',').filter(Boolean) || []

  // Get contractor info
  const { data: contractor } = await supabase
    .from('contractors')
    .select('company_name, name')
    .eq('id', currentUser.contractor_id)
    .single()

  // Build query with filters
  let query = supabase
    .from('users')
    .select('id, role, created_at')
    .eq('contractor_id', currentUser.contractor_id)

  // Apply role filter
  if (roleFilter.length > 0) {
    query = query.in('role', roleFilter)
  }

  const { data: teamMembers, error: teamError } = await query.order('created_at', { ascending: true })

  if (teamError) {
    console.error('Error fetching team members:', teamError)
  }

  // Get contractor details for each user separately
  let teamMembersWithDetails = teamMembers ? await Promise.all(
    teamMembers.map(async (member) => {
      const { data: contractorData } = await supabase
        .from('contractors')
        .select('email, name')
        .eq('id', member.id)
        .single()

      return {
        ...member,
        contractors: contractorData
      }
    })
  ) : []

  // Apply search filter on the fetched data
  if (searchTerm) {
    teamMembersWithDetails = teamMembersWithDetails.filter((member) => {
      const name = member.contractors?.name?.toLowerCase() || ''
      const email = member.contractors?.email?.toLowerCase() || ''
      const term = searchTerm.toLowerCase()
      return name.includes(term) || email.includes(term)
    })
  }

  const canManageTeam = ['owner', 'admin'].includes(currentUser.role)
  const isOwner = currentUser.role === 'owner'

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Team</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your team members and their permissions
          </p>
          {contractor && (
            <p className="mt-1 text-sm text-gray-500">
              {contractor.company_name || contractor.name}
            </p>
          )}
        </div>
        {canManageTeam && (
          <Link
            href="/dashboard/team/invite"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Invite Team Member
          </Link>
        )}
      </div>

      {/* Search and Filter */}
      <SearchFilter
        placeholder="Search team members by name or email..."
        statusOptions={[
          { value: 'owner', label: 'Owner' },
          { value: 'admin', label: 'Admin' },
          { value: 'member', label: 'Member' },
          { value: 'viewer', label: 'Viewer' },
        ]}
        statusLabel="Filter by Role"
      />

      {/* Role Descriptions */}
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Role Permissions:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li><strong>Owner:</strong> Full access, can manage team members and delete data</li>
          <li><strong>Admin:</strong> Full access to data, can manage team members</li>
          <li><strong>Member:</strong> Can create and edit clients, quotes, and projects</li>
          <li><strong>Viewer:</strong> Read-only access to all data</li>
        </ul>
      </div>

      {/* Team Members List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        {teamMembersWithDetails && teamMembersWithDetails.length > 0 ? (
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
                  Email
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Role
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Joined
                </th>
                {canManageTeam && (
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {teamMembersWithDetails.map((member: any) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {member.contractors?.name || 'Unknown'}
                      {member.id === user.id && (
                        <span className="ml-2 text-xs text-gray-500">(You)</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {member.contractors?.email || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {canManageTeam && member.id !== user.id ? (
                      <form action={updateUserRole.bind(null, member.id, member.role)} className="inline">
                        <select
                          name="role"
                          defaultValue={member.role}
                          onChange={(e) => {
                            const form = e.target.closest('form')
                            if (form) {
                              const action = updateUserRole.bind(null, member.id, e.target.value)
                              form.action = action as any
                              form.requestSubmit()
                            }
                          }}
                          className="text-sm rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                          <option value="owner">Owner</option>
                          <option value="admin">Admin</option>
                          <option value="member">Member</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      </form>
                    ) : (
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          member.role === 'owner'
                            ? 'bg-purple-100 text-purple-800'
                            : member.role === 'admin'
                            ? 'bg-blue-100 text-blue-800'
                            : member.role === 'member'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {member.role}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {new Date(member.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  {canManageTeam && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {isOwner && member.id !== user.id && (
                        <form action={removeTeamMember.bind(null, member.id)} className="inline">
                          <button
                            type="submit"
                            onClick={(e) => {
                              if (!confirm('Are you sure you want to remove this team member?')) {
                                e.preventDefault()
                              }
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            Remove
                          </button>
                        </form>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-4 py-12 text-center">
            <p className="text-gray-500 mb-4">No team members yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
