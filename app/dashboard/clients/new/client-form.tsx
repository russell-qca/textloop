'use client'

import { useState } from 'react'
import AddressAutocomplete from '@/app/components/address-autocomplete'
import PhoneInput from '@/app/components/phone-input'

interface ExistingClient {
  client_name: string
  client_phone: string
  client_email: string | null
  client_address_street: string | null
  client_address_city: string | null
  client_address_state: string | null
  client_address_zip: string | null
  client_address_unit: string | null
  lead_date: string | null
  lead_origin: 'Direct' | 'Angis' | 'Thumbtack' | 'Referral' | null
  visit_date: string | null
  status: 'lead' | 'active' | 'archived' | 'lead/scheduled' | 'lead/quote'
  notes: string | null
}

interface ClientFormProps {
  createClientAction: (formData: FormData) => Promise<void>
  existingClient?: ExistingClient
  isEditing?: boolean
}

export default function ClientForm({ createClientAction, existingClient, isEditing = false }: ClientFormProps) {
  const [clientAddress, setClientAddress] = useState({
    street: existingClient?.client_address_street || '',
    city: existingClient?.client_address_city || '',
    state: existingClient?.client_address_state || '',
    zip: existingClient?.client_address_zip || '',
    unit: existingClient?.client_address_unit || '',
  })

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <form action={createClientAction} className="space-y-6 p-6">
        {/* Client Information */}
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
            Client Information
          </h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="client_name" className="block text-sm font-medium text-gray-700">
                Client Name *
              </label>
              <input
                type="text"
                name="client_name"
                id="client_name"
                required
                defaultValue={existingClient?.client_name || ''}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm text-gray-900"
                placeholder="John Smith"
              />
            </div>

            <div>
              <label htmlFor="client_phone" className="block text-sm font-medium text-gray-700">
                Phone Number *
              </label>
              <PhoneInput
                name="client_phone"
                id="client_phone"
                required
                defaultValue={existingClient?.client_phone || ''}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm text-gray-900"
                placeholder="(555) 555-5555"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="client_email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                name="client_email"
                id="client_email"
                defaultValue={existingClient?.client_email || ''}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm text-gray-900"
                placeholder="john@example.com"
              />
            </div>
          </div>
        </div>

        {/* Lead Information */}
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
            Lead Information
          </h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="lead_date" className="block text-sm font-medium text-gray-700">
                Lead Date
              </label>
              <input
                type="date"
                name="lead_date"
                id="lead_date"
                defaultValue={existingClient?.lead_date || ''}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm text-gray-900"
              />
              <p className="mt-1 text-sm text-gray-500">When did the client originally contact you?</p>
            </div>

            <div>
              <label htmlFor="lead_origin" className="block text-sm font-medium text-gray-700">
                Lead Origin
              </label>
              <select
                name="lead_origin"
                id="lead_origin"
                defaultValue={existingClient?.lead_origin || ''}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm text-gray-900"
              >
                <option value="">Select source...</option>
                <option value="Direct">Direct</option>
                <option value="Angis">Angis</option>
                <option value="Thumbtack">Thumbtack</option>
                <option value="Referral">Referral</option>
              </select>
            </div>

            <div>
              <label htmlFor="visit_date" className="block text-sm font-medium text-gray-700">
                Visit Date
              </label>
              <input
                type="date"
                name="visit_date"
                id="visit_date"
                defaultValue={existingClient?.visit_date || ''}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm text-gray-900"
              />
              <p className="mt-1 text-sm text-gray-500">When did you visit the client?</p>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status *
              </label>
              <select
                name="status"
                id="status"
                required
                defaultValue={existingClient?.status || 'lead'}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm text-gray-900"
              >
                <option value="lead">Lead</option>
                <option value="lead/scheduled">Lead - Scheduled</option>
                <option value="lead/quote">Lead - Quote</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">Status is automatically set based on visit date and quotes</p>
            </div>
          </div>
        </div>

        {/* Address */}
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
            Address
          </h3>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label htmlFor="client_address_street" className="block text-sm font-medium text-gray-700">
                Street Address
              </label>
              <AddressAutocomplete
                id="client_address_autocomplete"
                name="client_address_autocomplete_temp"
                placeholder="Start typing address..."
                defaultValue={existingClient?.client_address_street || ''}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm text-gray-900"
                includeCounty={false}
                onPlaceSelected={(address) => {
                  setClientAddress({
                    street: address.street,
                    city: address.city,
                    state: address.state,
                    zip: address.zip,
                    unit: '',
                  })
                }}
              />
              {/* Hidden input for actual form submission */}
              <input type="hidden" name="client_address_street" value={clientAddress.street} />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label htmlFor="client_address_unit" className="block text-sm font-medium text-gray-700">
                  Unit/Apt (Optional)
                </label>
                <input
                  type="text"
                  name="client_address_unit"
                  id="client_address_unit"
                  value={clientAddress.unit}
                  onChange={(e) => setClientAddress({ ...clientAddress, unit: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm text-gray-900"
                  placeholder="Apt 2B"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div>
                <label htmlFor="client_address_city" className="block text-sm font-medium text-gray-700">
                  City
                </label>
                <input
                  type="text"
                  name="client_address_city"
                  id="client_address_city"
                  value={clientAddress.city}
                  onChange={(e) => setClientAddress({ ...clientAddress, city: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm text-gray-900"
                  placeholder="Austin"
                />
              </div>

              <div>
                <label htmlFor="client_address_state" className="block text-sm font-medium text-gray-700">
                  State
                </label>
                <input
                  type="text"
                  name="client_address_state"
                  id="client_address_state"
                  maxLength={2}
                  value={clientAddress.state}
                  onChange={(e) => setClientAddress({ ...clientAddress, state: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm text-gray-900"
                  placeholder="TX"
                />
              </div>

              <div>
                <label htmlFor="client_address_zip" className="block text-sm font-medium text-gray-700">
                  ZIP Code
                </label>
                <input
                  type="text"
                  name="client_address_zip"
                  id="client_address_zip"
                  value={clientAddress.zip}
                  onChange={(e) => setClientAddress({ ...clientAddress, zip: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm text-gray-900"
                  placeholder="78701"
                />
              </div>
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
              defaultValue={existingClient?.notes || ''}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm text-gray-900"
              placeholder="Any additional information about this client..."
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <a
            href="/dashboard/clients"
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </a>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            {isEditing ? 'Update Client' : 'Create Client'}
          </button>
        </div>
      </form>
    </div>
  )
}
