'use client'

import { useState } from 'react'
import { updateContractorSettings } from './actions'

interface SettingsFormProps {
  contractor: {
    id: string
    name: string
    email: string
    company_name: string | null
    phone: string | null
    city: string | null
    state: string | null
    street_address: string | null
    address_unit: string | null
    zip_code: string | null
    logo_url: string | null
    twilio_phone_number: string | null
  }
}

export default function SettingsForm({ contractor }: SettingsFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(contractor.logo_url)
  const [logoFile, setLogoFile] = useState<File | null>(null)

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    const formData = new FormData(e.currentTarget)

    // Add logo file if one was selected
    if (logoFile) {
      formData.append('logo', logoFile)
    }

    const result = await updateContractorSettings(formData)

    setIsSubmitting(false)

    if (result.success) {
      setMessage({ type: 'success', text: 'Settings updated successfully!' })
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to update settings' })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <input type="hidden" name="contractor_id" value={contractor.id} />

      {message && (
        <div
          className={`rounded-md p-4 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Your Name *
          </label>
          <input
            type="text"
            name="name"
            id="name"
            required
            defaultValue={contractor.name}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email *
          </label>
          <input
            type="email"
            name="email"
            id="email"
            required
            defaultValue={contractor.email}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
          />
        </div>

        <div>
          <label htmlFor="company_name" className="block text-sm font-medium text-gray-700">
            Company Name
          </label>
          <input
            type="text"
            name="company_name"
            id="company_name"
            defaultValue={contractor.company_name || ''}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="logo" className="block text-sm font-medium text-gray-700 mb-2">
            Company Logo
          </label>
          <div className="flex items-center space-x-6">
            {logoPreview && (
              <div className="flex-shrink-0">
                <img
                  src={logoPreview}
                  alt="Company logo preview"
                  className="h-20 w-20 object-contain rounded-md border border-gray-300 bg-white p-2"
                />
              </div>
            )}
            <div className="flex-1">
              <input
                type="file"
                id="logo"
                name="logo"
                accept="image/*"
                onChange={handleLogoChange}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-medium
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
              <p className="mt-1 text-xs text-gray-500">
                PNG, JPG, or SVG up to 2MB. Recommended: Square image, at least 200x200px
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Company Address Section */}
      <div className="border-t border-gray-200 pt-6 mt-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">Company Address</h4>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="street_address" className="block text-sm font-medium text-gray-700">
              Street Address
            </label>
            <input
              type="text"
              name="street_address"
              id="street_address"
              defaultValue={contractor.street_address || ''}
              placeholder="123 Main St"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
            />
          </div>

          <div>
            <label htmlFor="address_unit" className="block text-sm font-medium text-gray-700">
              Unit/Suite (Optional)
            </label>
            <input
              type="text"
              name="address_unit"
              id="address_unit"
              defaultValue={contractor.address_unit || ''}
              placeholder="Suite 100"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
            />
          </div>

          <div>
            <label htmlFor="zip_code" className="block text-sm font-medium text-gray-700">
              ZIP Code
            </label>
            <input
              type="text"
              name="zip_code"
              id="zip_code"
              defaultValue={contractor.zip_code || ''}
              placeholder="12345"
              maxLength={10}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6 mt-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">Contact & Settings</h4>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Phone Number
          </label>
          <input
            type="tel"
            name="phone"
            id="phone"
            defaultValue={contractor.phone || ''}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
          />
        </div>

        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700">
            City
          </label>
          <input
            type="text"
            name="city"
            id="city"
            defaultValue={contractor.city || ''}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
          />
          <p className="mt-1 text-xs text-gray-500">
            Used for weather forecast on dashboard
          </p>
        </div>

        <div>
          <label htmlFor="state" className="block text-sm font-medium text-gray-700">
            State
          </label>
          <input
            type="text"
            name="state"
            id="state"
            defaultValue={contractor.state || ''}
            placeholder="e.g., CA, NY, TX"
            maxLength={2}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
          />
          <p className="mt-1 text-xs text-gray-500">
            2-letter state code (used for weather forecast)
          </p>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="twilio_phone_number" className="block text-sm font-medium text-gray-700">
            Twilio Phone Number
          </label>
          <input
            type="tel"
            name="twilio_phone_number"
            id="twilio_phone_number"
            defaultValue={contractor.twilio_phone_number || ''}
            placeholder="+1234567890"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
          />
          <p className="mt-1 text-xs text-gray-500">
            Your Twilio phone number for sending SMS messages
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}
