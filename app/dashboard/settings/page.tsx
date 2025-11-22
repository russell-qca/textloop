import { createClient } from '@/lib/supabase/server'
import SettingsForm from './settings-form'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Get user's contractor_id
  const { data: userRecord } = await supabase
    .from('users')
    .select('contractor_id')
    .eq('id', user.id)
    .single()

  if (!userRecord) return null

  // Get contractor info
  const { data: contractor } = await supabase
    .from('contractors')
    .select('*')
    .eq('id', userRecord.contractor_id)
    .single()

  if (!contractor) return null

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your company profile and preferences
        </p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
            Company Information
          </h3>
          <SettingsForm contractor={contractor} />
        </div>
      </div>
    </div>
  )
}
