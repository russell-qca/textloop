import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import ProjectForm from './project-form'

async function createProject(formData: FormData) {
  'use server'

  console.log('=== createProject server action called ===')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    console.log('No user found, redirecting to login')
    redirect('/login')
  }

  console.log('User authenticated:', user.id)

  // Get user's contractor_id
  const { data: userRecord } = await supabase
    .from('users')
    .select('contractor_id')
    .eq('id', user.id)
    .single()

  if (!userRecord) {
    throw new Error('User not found')
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

  console.log('Creating project with data:', {
    clientId,
    projectType,
    projectDescription,
    projectAddressStreet,
    projectAddressCity,
    projectAddressState,
    projectAddressZip,
    projectAddressCounty
  })

  // Create the project
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({
      contractor_id: userRecord.contractor_id,
      client_id: clientId,
      project_type: projectType,
      project_description: projectDescription,
      start_date: startDate,
      end_date: endDate,
      project_cost: projectCost,
      permits_required: permitsRequired,
      permit_status: permitsRequired ? permitStatus : 'not_applicable',
      status: 'planned',
      project_address_street: projectAddressStreet,
      project_address_city: projectAddressCity,
      project_address_state: projectAddressState,
      project_address_zip: projectAddressZip,
      project_address_unit: projectAddressUnit,
      project_address_county: projectAddressCounty,
      notes,
    })
    .select()
    .single()

  if (projectError) {
    console.error('Error creating project:', projectError)
    // Log more details for debugging
    console.error('Error details:', {
      message: projectError.message,
      details: projectError.details,
      hint: projectError.hint,
      code: projectError.code
    })
    throw new Error(`Failed to create project: ${projectError.message}`)
  }

  if (!project) {
    console.error('No project returned after insert')
    throw new Error('Failed to create project: No data returned')
  }

  console.log('Project created successfully:', project.id)

  revalidatePath('/dashboard/projects')
  revalidatePath(`/dashboard/clients/${clientId}`)
  redirect(`/dashboard/projects/${project.id}`)
}

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: { client_id?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const resolvedSearchParams = await searchParams
  const preselectedClientId = resolvedSearchParams.client_id

  // Get all clients for the dropdown
  const { data: clients } = await supabase
    .from('clients')
    .select('id, first_name, last_name, client_phone')
    .eq('contractor_id', user.id)
    .order('first_name', { ascending: true })

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Create New Project</h1>
        <p className="mt-1 text-sm text-gray-600">
          Add a new project to track progress and manage details
        </p>
      </div>

      <ProjectForm
        clients={clients}
        preselectedClientId={preselectedClientId}
        createProjectAction={createProject}
      />
    </div>
  )
}
