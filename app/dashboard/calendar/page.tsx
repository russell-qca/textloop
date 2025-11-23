import { createClient } from '@/lib/supabase/server'
import { ensureUserRecord } from '@/lib/ensure-user-record'
import CalendarView from './calendar-view'

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const userRecord = await ensureUserRecord(supabase, user.id)

  // Fetch all projects with client names and group colors
  // Exclude cancelled projects
  const { data: projects } = await supabase
    .from('projects')
    .select(`
      id,
      project_type,
      start_date,
      end_date,
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
