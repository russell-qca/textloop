import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { ensureUserRecord } from '@/lib/ensure-user-record'
import GroupsClient from './groups-client'

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

  return (
    <GroupsClient
      groups={groups || []}
      projectCounts={projectCounts}
      createGroupAction={createGroup}
      updateGroupAction={updateGroup}
      deleteGroupAction={deleteGroup}
    />
  )
}
