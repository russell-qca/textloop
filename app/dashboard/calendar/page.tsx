import { createClient } from '@/lib/supabase/server'
import { ensureUserRecord } from '@/lib/ensure-user-record'
import CalendarView from './calendar-view'

interface CalendarProject {
  id: string
  project_type: string
  start_date: string | null
  end_date: string | null
  exclude_weekends: boolean
  group_id: string | null
  clients: {
    first_name: string
    last_name: string
  } | null
  project_groups: {
    color: string
  } | null
}

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const userRecord = await ensureUserRecord(supabase, user.id)

  // Fetch all projects with client names and group colors
  // Exclude cancelled projects
  const { data: rawProjects } = await supabase
    .from('projects')
    .select(`
      id,
      project_type,
      start_date,
      end_date,
      exclude_weekends,
      group_id,
      clients (
        first_name,
        last_name
      ),
      project_groups (
        color
      )
    `)
    .eq('contractor_id', userRecord.contractor_id)
    .neq('status', 'cancelled')
    .order('start_date', { ascending: true })

  // Type assertion: Supabase returns arrays for relations, but these are single objects
  const projects = (rawProjects as any[])?.map((project) => ({
    ...project,
    clients: Array.isArray(project.clients) ? project.clients[0] : project.clients,
    project_groups: Array.isArray(project.project_groups) ? project.project_groups[0] : project.project_groups,
  })) as CalendarProject[]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Project Calendar</h1>
        <p className="mt-1 text-sm text-gray-600">
          View and manage your project schedule. Projects are color-coded by work crew.
        </p>
      </div>

      <CalendarView projects={projects || []} />
    </div>
  )
}
