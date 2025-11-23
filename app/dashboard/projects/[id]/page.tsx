import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { formatPhoneNumber } from '@/lib/format-phone'
import Map from '@/app/components/map'
import InspectionTracker from '@/app/components/inspection-tracker'
import EditableNotes from '@/app/components/editable-notes'
import WeatherWidget from '@/app/components/weather-widget'
import { formatAddressForWeather } from '@/lib/weather'
import { Database } from '@/types/database'

type InspectionType = Database['public']['Tables']['inspections']['Row']['inspection_type']

async function updateProjectStatus(projectId: string, status: string) {
  'use server'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  await supabase
    .from('projects')
    .update({ status })
    .eq('id', projectId)
    .eq('contractor_id', user.id)

  revalidatePath(`/dashboard/projects/${projectId}`)
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/projects')
}

async function updatePermitStatus(projectId: string, permitStatus: string) {
  'use server'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  await supabase
    .from('projects')
    .update({ permit_status: permitStatus })
    .eq('id', projectId)
    .eq('contractor_id', user.id)

  revalidatePath(`/dashboard/projects/${projectId}`)
}

async function addInspection(projectId: string, inspectionType: InspectionType) {
  'use server'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  await supabase
    .from('inspections')
    .insert({
      project_id: projectId,
      inspection_type: inspectionType,
      completed: false,
    })

  revalidatePath(`/dashboard/projects/${projectId}`)
}

async function completeInspection(inspectionId: string, completedDate: string) {
  'use server'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  await supabase
    .from('inspections')
    .update({
      completed: true,
      completed_date: completedDate,
    })
    .eq('id', inspectionId)

  // Get the project_id to revalidate the correct path
  const { data: inspection } = await supabase
    .from('inspections')
    .select('project_id')
    .eq('id', inspectionId)
    .single()

  if (inspection) {
    revalidatePath(`/dashboard/projects/${inspection.project_id}`)
  }
}

async function deleteInspection(inspectionId: string) {
  'use server'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get the project_id before deleting
  const { data: inspection } = await supabase
    .from('inspections')
    .select('project_id')
    .eq('id', inspectionId)
    .single()

  await supabase
    .from('inspections')
    .delete()
    .eq('id', inspectionId)

  if (inspection) {
    revalidatePath(`/dashboard/projects/${inspection.project_id}`)
  }
}

async function updateProjectNotes(projectId: string, notes: string) {
  'use server'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  await supabase
    .from('projects')
    .update({ notes: notes || null })
    .eq('id', projectId)
    .eq('contractor_id', user.id)

  revalidatePath(`/dashboard/projects/${projectId}`)
}

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const resolvedParams = await params

  // Get project details with client information
  const { data: project } = await supabase
    .from('projects')
    .select(`
      *,
      clients (
        id,
        first_name,
        last_name,
        client_phone,
        client_email,
        client_address_street,
        client_address_city,
        client_address_state,
        client_address_zip,
        client_address_unit
      )
    `)
    .eq('id', resolvedParams.id)
    .eq('contractor_id', user.id)
    .single()

  if (!project) {
    redirect('/dashboard/projects')
  }

  // Get messages for this project
  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('project_id', project.id)
    .order('sequence_day', { ascending: true })

  // Get inspections for this project
  const { data: inspections } = await supabase
    .from('inspections')
    .select('*')
    .eq('project_id', project.id)
    .order('created_at', { ascending: true })

  return (
    <div>
      {/* Weather Widget */}
      {project.project_address_city && project.project_address_state && (
        <WeatherWidget
          address={formatAddressForWeather(
            project.project_address_street,
            project.project_address_city,
            project.project_address_state,
            project.project_address_zip
          )}
        />
      )}

      <div className="mb-8">
        <Link
          href="/dashboard/projects"
          className="text-sm text-blue-600 hover:text-blue-800 mb-4 inline-block"
        >
          ← Back to Projects
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{project.project_type}</h1>
            <p className="mt-1 text-sm text-gray-600">{project.clients?.first_name} {project.clients?.last_name}</p>
          </div>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
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
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Client Information</h2>
              <Link
                href={`/dashboard/clients/${project.clients?.id}`}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                View Client →
              </Link>
            </div>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Name</dt>
                <dd className="mt-1 text-sm text-gray-900">{project.clients?.first_name} {project.clients?.last_name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Phone</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatPhoneNumber(project.clients?.client_phone)}</dd>
              </div>
              {project.clients?.client_email && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{project.clients.client_email}</dd>
                </div>
              )}
              {project.clients?.client_address_street && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Address</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {project.clients.client_address_street}
                    {project.clients.client_address_unit && `, ${project.clients.client_address_unit}`}
                    <br />
                    {project.clients.client_address_city && `${project.clients.client_address_city}, `}
                    {project.clients.client_address_state && `${project.clients.client_address_state} `}
                    {project.clients.client_address_zip}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Project Address */}
          {(project.project_address_street || project.project_address_city) && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Project Address</h2>
              <p className="text-sm text-gray-500 mb-4">Location where the work will be performed</p>
              <dl className="grid grid-cols-1 gap-4 mb-4">
                <div>
                  <dd className="text-sm text-gray-900">
                    {project.project_address_street}
                    {project.project_address_unit && `, ${project.project_address_unit}`}
                    <br />
                    {project.project_address_city && `${project.project_address_city}, `}
                    {project.project_address_state && `${project.project_address_state} `}
                    {project.project_address_zip}
                  </dd>
                </div>
                {project.project_address_county && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">County</dt>
                    <dd className="mt-1 text-sm text-gray-900">{project.project_address_county}</dd>
                  </div>
                )}
              </dl>
              {/* Map */}
              <Map
                address={`${project.project_address_street}${project.project_address_unit ? ` ${project.project_address_unit}` : ''}, ${project.project_address_city}, ${project.project_address_state} ${project.project_address_zip}`}
                className="w-full h-[300px] rounded-lg border border-gray-200"
              />
            </div>
          )}

          {/* Project Details */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Project Details</h2>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                  {project.project_description}
                </dd>
              </div>
              {project.project_cost && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Project Cost</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    ${project.project_cost.toLocaleString()}
                  </dd>
                </div>
              )}
              {project.start_date && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Start Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(project.start_date).toLocaleDateString()}
                  </dd>
                </div>
              )}
              {project.end_date && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">End Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(project.end_date).toLocaleDateString()}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(project.created_at).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>

          {/* Permits */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Permits</h2>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">Permits Required</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {project.permits_required ? 'Yes' : 'No'}
                </dd>
              </div>
              {project.permits_required && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Permit Status</dt>
                  <dd className="mt-1">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        project.permit_status === 'not_submitted'
                          ? 'bg-orange-100 text-orange-800'
                          : project.permit_status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : project.permit_status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : project.permit_status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {project.permit_status === 'not_submitted' ? 'Not Submitted' : project.permit_status}
                    </span>
                  </dd>
                </div>
              )}
            </dl>
            {project.permits_required && (
              <div className="mt-4 flex flex-wrap gap-2">
                {project.permit_status !== 'not_submitted' && (
                  <form action={updatePermitStatus.bind(null, project.id, 'not_submitted')}>
                    <button
                      type="submit"
                      className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Not Submitted
                    </button>
                  </form>
                )}
                {project.permit_status !== 'pending' && (
                  <form action={updatePermitStatus.bind(null, project.id, 'pending')}>
                    <button
                      type="submit"
                      className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Mark Pending
                    </button>
                  </form>
                )}
                {project.permit_status !== 'approved' && (
                  <form action={updatePermitStatus.bind(null, project.id, 'approved')}>
                    <button
                      type="submit"
                      className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700"
                    >
                      Mark Approved
                    </button>
                  </form>
                )}
                {project.permit_status !== 'rejected' && (
                  <form action={updatePermitStatus.bind(null, project.id, 'rejected')}>
                    <button
                      type="submit"
                      className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Mark Rejected
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Permit Inspections */}
          {project.permits_required && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Permit Inspections</h2>
              <p className="text-sm text-gray-500 mb-4">
                Track the progress of required permit inspections
              </p>
              <InspectionTracker
                projectId={project.id}
                initialInspections={inspections || []}
                onAddInspection={addInspection}
                onCompleteInspection={completeInspection}
                onDeleteInspection={deleteInspection}
              />
            </div>
          )}

          {/* Notes */}
          <EditableNotes
            initialNotes={project.notes}
            onSave={updateProjectNotes.bind(null, project.id)}
          />

          {/* Follow-up Messages */}
          {messages && messages.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Follow-up Messages</h2>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className="border-l-4 border-gray-200 pl-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            Day {message.sequence_day}
                          </span>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              message.status === 'sent'
                                ? 'bg-green-100 text-green-800'
                                : message.status === 'failed'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {message.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{message.message_text}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {message.sent_at
                            ? `Sent: ${new Date(message.sent_at).toLocaleString()}`
                            : `Scheduled: ${new Date(message.scheduled_for).toLocaleString()}`}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Project Actions</h2>
            <div className="space-y-3">
              <Link
                href={`/dashboard/projects/${project.id}/edit`}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Edit Project
              </Link>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Project Status</h2>
            <div className="space-y-3">
              {project.status !== 'active' && (
                <form action={updateProjectStatus.bind(null, project.id, 'active')} className="w-full">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                  >
                    Mark as Active
                  </button>
                </form>
              )}
              {project.status !== 'completed' && (
                <form action={updateProjectStatus.bind(null, project.id, 'completed')} className="w-full">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Mark as Completed
                  </button>
                </form>
              )}
              {project.status !== 'cancelled' && (
                <form action={updateProjectStatus.bind(null, project.id, 'cancelled')} className="w-full">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Mark as Cancelled
                  </button>
                </form>
              )}
              {project.status !== 'planned' && (
                <form action={updateProjectStatus.bind(null, project.id, 'planned')} className="w-full">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Mark as Planned
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
