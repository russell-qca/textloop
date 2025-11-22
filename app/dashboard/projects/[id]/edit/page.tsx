import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import ProjectForm from '../../new/project-form'

async function updateProject(projectId: string, formData: FormData) {
  'use server'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const clientId = formData.get('client_id') as string
  const projectType = formData.get('project_type') as string
  const projectDescription = formData.get('project_description') as string
  const startDate = formData.get('start_date') as string || null
  const endDate = formData.get('end_date') as string || null
  const projectCost = formData.get('project_cost') ? parseFloat(formData.get('project_cost') as string) : null
  const permitsRequired = formData.get('permits_required') === 'true'
  const permitStatus = formData.get('permit_status') as string || null
  const projectAddressStreet = formData.get('project_address_street') as string || null
  const projectAddressCity = formData.get('project_address_city') as string || null
  const projectAddressState = formData.get('project_address_state') as string || null
  const projectAddressZip = formData.get('project_address_zip') as string || null
  const projectAddressUnit = formData.get('project_address_unit') as string || null
  const projectAddressCounty = formData.get('project_address_county') as string || null
  const notes = formData.get('notes') as string || null

  // Update the project
  const { error } = await supabase
    .from('projects')
    .update({
      client_id: clientId,
      project_type: projectType,
      project_description: projectDescription,
      start_date: startDate,
      end_date: endDate,
      project_cost: projectCost,
      permits_required: permitsRequired,
      permit_status: permitsRequired ? permitStatus : 'not_applicable',
      project_address_street: projectAddressStreet,
      project_address_city: projectAddressCity,
      project_address_state: projectAddressState,
      project_address_zip: projectAddressZip,
      project_address_unit: projectAddressUnit,
      project_address_county: projectAddressCounty,
      notes,
    })
    .eq('id', projectId)
    .eq('contractor_id', user.id)

  if (error) {
    console.error('Error updating project:', error)
    throw new Error(`Failed to update project: ${error.message}`)
  }

  revalidatePath(`/dashboard/projects/${projectId}`)
  revalidatePath('/dashboard/projects')
  revalidatePath(`/dashboard/clients/${clientId}`)
  redirect(`/dashboard/projects/${projectId}`)
}

export default async function EditProjectPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const resolvedParams = await params

  // Get the existing project
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', resolvedParams.id)
    .eq('contractor_id', user.id)
    .single()

  if (!project) {
    redirect('/dashboard/projects')
  }

  // Get all clients for the dropdown
  const { data: clients } = await supabase
    .from('clients')
    .select('id, client_name, client_phone')
    .eq('contractor_id', user.id)
    .order('client_name', { ascending: true })

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Edit Project</h1>
        <p className="mt-1 text-sm text-gray-600">
          Update project details
        </p>
      </div>

      <ProjectForm
        clients={clients}
        createProjectAction={updateProject.bind(null, project.id)}
        existingProject={project}
        isEditing={true}
      />
    </div>
  )
}
