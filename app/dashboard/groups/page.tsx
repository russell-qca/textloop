import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { ensureUserRecord } from '@/lib/ensure-user-record'

async function createGroup(formData: FormData) {
  'use server'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const userRecord = await ensureUserRecord(supabase, user.id)

  const name = formData.get('name') as string
  const color = formData.get('color') as string

  await supabase
    .from('project_groups')
    .insert({
      contractor_id: userRecord.contractor_id,
      name,
      color,
    })

  revalidatePath('/dashboard/groups')
}

async function updateGroup(groupId: string, formData: FormData) {
  'use server'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const userRecord = await ensureUserRecord(supabase, user.id)

  const name = formData.get('name') as string
  const color = formData.get('color') as string

  await supabase
    .from('project_groups')
    .update({ name, color })
    .eq('id', groupId)
    .eq('contractor_id', userRecord.contractor_id)

  revalidatePath('/dashboard/groups')
}

async function deleteGroup(groupId: string) {
  'use server'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const userRecord = await ensureUserRecord(supabase, user.id)

  await supabase
    .from('project_groups')
    .delete()
    .eq('id', groupId)
    .eq('contractor_id', userRecord.contractor_id)

  revalidatePath('/dashboard/groups')
}

export default async function ProjectGroupsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const userRecord = await ensureUserRecord(supabase, user.id)

  // Get all project groups
  const { data: groups } = await supabase
    .from('project_groups')
    .select('*')
    .eq('contractor_id', userRecord.contractor_id)
    .order('name', { ascending: true })

  // Get project counts for each group
  const { data: projects } = await supabase
    .from('projects')
    .select('group_id')
    .eq('contractor_id', userRecord.contractor_id)

  const projectCounts: Record<string, number> = {}
  projects?.forEach(project => {
    if (project.group_id) {
      projectCounts[project.group_id] = (projectCounts[project.group_id] || 0) + 1
    }
  })

  // Default colors to suggest
  const defaultColors = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#14b8a6', // teal
    '#f97316', // orange
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Work Crews / Project Groups</h1>
        <p className="mt-1 text-sm text-gray-600">
          Organize projects by assigning them to work crews. Each crew has a unique color on the calendar.
        </p>
      </div>

      {/* Create New Group */}
      <div className="bg-white shadow sm:rounded-lg mb-6">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
            Create New Work Crew
          </h3>
          <form action={createGroup} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Crew Name *
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm text-gray-900"
                  placeholder="e.g., Main Crew, Team A, Weekend Squad"
                />
              </div>
              <div>
                <label htmlFor="color" className="block text-sm font-medium text-gray-700">
                  Color *
                </label>
                <div className="mt-1 flex items-center space-x-2">
                  <input
                    type="color"
                    name="color"
                    id="color"
                    required
                    defaultValue={defaultColors[0]}
                    className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                  />
                  <div className="flex flex-wrap gap-1">
                    {defaultColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={(e) => {
                          const input = document.getElementById('color') as HTMLInputElement
                          if (input) input.value = color
                        }}
                        className="w-6 h-6 rounded border border-gray-300 hover:border-gray-400"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Create Crew
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Existing Groups */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Existing Work Crews
          </h3>
        </div>
        {groups && groups.length > 0 ? (
          <div className="border-t border-gray-200">
            <ul className="divide-y divide-gray-200">
              {groups.map((group) => (
                <li key={group.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div
                        className="w-8 h-8 rounded border border-gray-300"
                        style={{ backgroundColor: group.color }}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{group.name}</p>
                        <p className="text-sm text-gray-500">
                          {projectCounts[group.id] || 0} project{projectCounts[group.id] !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {/* Edit Form (inline) */}
                      <details className="relative">
                        <summary className="cursor-pointer px-3 py-1 text-sm text-blue-600 hover:text-blue-800">
                          Edit
                        </summary>
                        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10">
                          <form action={updateGroup.bind(null, group.id)} className="space-y-3">
                            <div>
                              <label htmlFor={`edit-name-${group.id}`} className="block text-sm font-medium text-gray-700">
                                Crew Name
                              </label>
                              <input
                                type="text"
                                name="name"
                                id={`edit-name-${group.id}`}
                                required
                                defaultValue={group.name}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm text-gray-900"
                              />
                            </div>
                            <div>
                              <label htmlFor={`edit-color-${group.id}`} className="block text-sm font-medium text-gray-700">
                                Color
                              </label>
                              <input
                                type="color"
                                name="color"
                                id={`edit-color-${group.id}`}
                                required
                                defaultValue={group.color}
                                className="mt-1 h-10 w-full rounded border border-gray-300 cursor-pointer"
                              />
                            </div>
                            <div className="flex justify-end space-x-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  const details = e.currentTarget.closest('details')
                                  if (details) details.open = false
                                }}
                                className="px-3 py-1 text-sm text-gray-700 hover:text-gray-900"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                className="px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
                              >
                                Save
                              </button>
                            </div>
                          </form>
                        </div>
                      </details>
                      {/* Delete Form */}
                      <form action={deleteGroup.bind(null, group.id)}>
                        <button
                          type="submit"
                          className="px-3 py-1 text-sm text-red-600 hover:text-red-800"
                          onClick={(e) => {
                            if (!confirm(`Delete "${group.name}"? Projects in this crew will become unassigned.`)) {
                              e.preventDefault()
                            }
                          }}
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="px-4 py-12 text-center border-t border-gray-200">
            <p className="text-gray-500">No work crews yet. Create one above to get started!</p>
          </div>
        )}
      </div>
    </div>
  )
}
