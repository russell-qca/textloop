'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function updateProjectDates(projectId: string, startDate: string, endDate: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Update the project dates
  const { error } = await supabase
    .from('projects')
    .update({
      start_date: startDate.split('T')[0], // Convert to YYYY-MM-DD format
      end_date: endDate.split('T')[0],
    })
    .eq('id', projectId)
    .eq('contractor_id', user.id)

  if (error) {
    console.error('Error updating project dates:', error)
    throw new Error(`Failed to update project dates: ${error.message}`)
  }

  revalidatePath('/dashboard/calendar')
  revalidatePath('/dashboard/projects')
  revalidatePath(`/dashboard/projects/${projectId}`)
}
