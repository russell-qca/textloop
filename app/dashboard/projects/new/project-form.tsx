'use client'

import { useState } from 'react'
import AddressAutocomplete from '@/app/components/address-autocomplete'
import { formatPhoneNumber } from '@/lib/format-phone'

interface Client {
  id: string
  first_name: string
  last_name: string
  client_phone: string
}

interface ProjectGroup {
  id: string
  name: string
  color: string
}

interface ExistingProject {
  client_id: string
  group_id: string | null
  project_type: string
  project_description: string
  start_date: string | null
  end_date: string | null
  exclude_weekends: boolean
  project_cost: number | null
  permits_required: boolean
  permit_status: string | null
  project_address_street: string | null
  project_address_city: string | null
  project_address_state: string | null
  project_address_zip: string | null
  project_address_unit: string | null
  project_address_county: string | null
  notes: string | null
}

interface ProjectFormProps {
  clients: Client[] | null
  groups: ProjectGroup[] | null
  preselectedClientId?: string
  createProjectAction: (formData: FormData) => Promise<void>
  existingProject?: ExistingProject
  isEditing?: boolean
}

export default function ProjectForm({
  clients,
  groups,
  preselectedClientId,
  createProjectAction,
  existingProject,
  isEditing = false
}: ProjectFormProps) {
  const [permitsRequired, setPermitsRequired] = useState(existingProject?.permits_required || false)
  const [projectAddress, setProjectAddress] = useState({
    street: existingProject?.project_address_street || '',
    city: existingProject?.project_address_city || '',
    state: existingProject?.project_address_state || '',
    zip: existingProject?.project_address_zip || '',
    unit: existingProject?.project_address_unit || '',
    county: existingProject?.project_address_county || '',
  })

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <form action={createProjectAction} className="space-y-6 p-6">
        {/* Client Selection */}
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
            Client Selection
          </h3>
          <div>
            <label htmlFor="client_id" className="block text-sm font-medium text-gray-700">
              Select Client *
            </label>
            {clients && clients.length > 0 ? (
              <div className="mt-1">
                <select
                  name="client_id"
                  id="client_id"
                  required
                  defaultValue={existingProject?.client_id || preselectedClientId || ''}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm text-gray-900"
                >
                  <option value="">Select a client...</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.first_name} {client.last_name} - {formatPhoneNumber(client.client_phone)}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-sm text-gray-500">
                  Don't see the client?{' '}
                  <a href="/dashboard/clients/new" className="text-blue-600 hover:text-blue-800">
                    Add a new client first
                  </a>
                </p>
              </div>
            ) : (
              <div className="mt-1 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  You need to add a client first before creating a project.
                </p>
                <a
                  href="/dashboard/clients/new"
                  className="mt-2 inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                >
                  Add Client →
                </a>
              </div>
            )}
          </div>
        </div>

        {clients && clients.length > 0 && (
          <>
            {/* Project Details */}
            <div>
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                Project Details
              </h3>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label htmlFor="project_type" className="block text-sm font-medium text-gray-700">
                    Project Type *
                  </label>
                  <input
                    type="text"
                    name="project_type"
                    id="project_type"
                    required
                    defaultValue={existingProject?.project_type || ''}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm text-gray-900"
                    placeholder="Kitchen Remodel, HVAC Installation, Electrical Work, etc."
                  />
                </div>

                <div>
                  <label htmlFor="project_description" className="block text-sm font-medium text-gray-700">
                    Project Description *
                  </label>
                  <textarea
                    name="project_description"
                    id="project_description"
                    required
                    rows={3}
                    defaultValue={existingProject?.project_description || ''}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm text-gray-900"
                    placeholder="Detailed description of the work to be done..."
                  />
                </div>

                <div>
                  <label htmlFor="group_id" className="block text-sm font-medium text-gray-700">
                    Work Crew / Group
                  </label>
                  <select
                    name="group_id"
                    id="group_id"
                    defaultValue={existingProject?.group_id || ''}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm text-gray-900"
                  >
                    <option value="">Unassigned (light gray on calendar)</option>
                    {groups && groups.length > 0 && groups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                  {(!groups || groups.length === 0) && (
                    <p className="mt-2 text-sm text-gray-500">
                      No work crews yet.{' '}
                      <a href="/dashboard/groups" className="text-blue-600 hover:text-blue-800">
                        Create a work crew
                      </a>
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <div>
                    <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">
                      Start Date
                    </label>
                    <input
                      type="date"
                      name="start_date"
                      id="start_date"
                      defaultValue={existingProject?.start_date || ''}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm text-gray-900"
                    />
                  </div>

                  <div>
                    <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">
                      End Date
                    </label>
                    <input
                      type="date"
                      name="end_date"
                      id="end_date"
                      defaultValue={existingProject?.end_date || ''}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm text-gray-900"
                    />
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      name="exclude_weekends"
                      id="exclude_weekends"
                      defaultChecked={existingProject?.exclude_weekends || false}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="exclude_weekends" className="font-medium text-gray-700">
                      Exclude weekends from calendar
                    </label>
                    <p className="text-gray-500">
                      When enabled, this project will show gaps on Saturdays and Sundays in the calendar view
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <div>
                    <label htmlFor="project_cost" className="block text-sm font-medium text-gray-700">
                      Project Cost
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <input
                        type="number"
                        name="project_cost"
                        id="project_cost"
                        step="0.01"
                        min="0"
                        defaultValue={existingProject?.project_cost || ''}
                        className="block w-full rounded-md border border-gray-300 pl-7 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm text-gray-900"
                        placeholder="5000.00"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Project Address */}
            <div>
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                Project Address
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Enter the location where the project will be performed (if different from client's address)
              </p>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label htmlFor="project_address_street" className="block text-sm font-medium text-gray-700">
                    Street Address
                  </label>
                  <AddressAutocomplete
                    id="project_address_autocomplete"
                    name="project_address_autocomplete_temp"
                    placeholder="Start typing address..."
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm text-gray-900"
                    includeCounty={true}
                    onPlaceSelected={(address) => {
                      setProjectAddress({
                        street: address.street,
                        city: address.city,
                        state: address.state,
                        zip: address.zip,
                        unit: '',
                        county: address.county || '',
                      })
                    }}
                  />
                  {/* Hidden input for actual form submission */}
                  <input type="hidden" name="project_address_street" value={projectAddress.street} />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="project_address_unit" className="block text-sm font-medium text-gray-700">
                      Unit/Apt (Optional)
                    </label>
                    <input
                      type="text"
                      name="project_address_unit"
                      id="project_address_unit"
                      value={projectAddress.unit}
                      onChange={(e) => setProjectAddress({ ...projectAddress, unit: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm text-gray-900"
                      placeholder="Apt 2B"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <div>
                    <label htmlFor="project_address_city" className="block text-sm font-medium text-gray-700">
                      City
                    </label>
                    <input
                      type="text"
                      name="project_address_city"
                      id="project_address_city"
                      value={projectAddress.city}
                      onChange={(e) => setProjectAddress({ ...projectAddress, city: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm text-gray-900"
                      placeholder="Austin"
                    />
                  </div>

                  <div>
                    <label htmlFor="project_address_state" className="block text-sm font-medium text-gray-700">
                      State
                    </label>
                    <input
                      type="text"
                      name="project_address_state"
                      id="project_address_state"
                      maxLength={2}
                      value={projectAddress.state}
                      onChange={(e) => setProjectAddress({ ...projectAddress, state: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm text-gray-900"
                      placeholder="TX"
                    />
                  </div>

                  <div>
                    <label htmlFor="project_address_zip" className="block text-sm font-medium text-gray-700">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      name="project_address_zip"
                      id="project_address_zip"
                      value={projectAddress.zip}
                      onChange={(e) => setProjectAddress({ ...projectAddress, zip: e.target.value })}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm text-gray-900"
                      placeholder="78701"
                    />
                  </div>
                </div>

                {/* County display (auto-populated from address) */}
                {projectAddress.county && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      County
                    </label>
                    <div className="mt-1 block w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                      {projectAddress.county}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Auto-detected from address
                    </p>
                  </div>
                )}

                {/* Hidden input for county */}
                <input type="hidden" name="project_address_county" value={projectAddress.county} />
              </div>
            </div>

            {/* Permits */}
            <div>
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                Permits
              </h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="permits_required" className="block text-sm font-medium text-gray-700">
                    Permits Required? *
                  </label>
                  <select
                    name="permits_required"
                    id="permits_required"
                    required
                    value={permitsRequired ? 'true' : 'false'}
                    onChange={(e) => setPermitsRequired(e.target.value === 'true')}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm text-gray-900"
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="permit_status" className="block text-sm font-medium text-gray-700">
                    Permit Status
                  </label>
                  <select
                    name="permit_status"
                    id="permit_status"
                    disabled={!permitsRequired}
                    defaultValue={existingProject?.permit_status || "not_submitted"}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm text-gray-900 disabled:bg-gray-100"
                  >
                    <option value="not_submitted">Not Submitted</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <p className="mt-1 text-sm text-gray-500">
                    Only applicable if permits are required
                  </p>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                Notes
              </h3>
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Additional Notes
                </label>
                <textarea
                  name="notes"
                  id="notes"
                  rows={4}
                  defaultValue={existingProject?.notes || ''}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm text-gray-900"
                  placeholder="Any additional information about this project..."
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <a
                href="/dashboard/projects"
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </a>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                {isEditing ? 'Update Project' : 'Create Project'}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  )
}
