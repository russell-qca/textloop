import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { signOut } from '@/app/auth/actions'
import NavLink from './nav-link'
import Link from 'next/link'
import { ensureUserRecord } from '@/lib/ensure-user-record'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Ensure user record exists and get user info
  const userRecord = await ensureUserRecord(supabase, user.id)

  // Get contractor info separately
  const contractor = userRecord ? (await supabase
    .from('contractors')
    .select('name, company_name, logo_url')
    .eq('id', userRecord.contractor_id)
    .single()).data : null

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/dashboard" className="text-2xl font-bold text-blue-600">
                  TextLoop
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <NavLink href="/dashboard">
                  Dashboard
                </NavLink>
                <NavLink href="/dashboard/calendar">
                  Calendar
                </NavLink>
                <NavLink href="/dashboard/clients">
                  Clients
                </NavLink>
                <NavLink href="/dashboard/quotes">
                  Quotes
                </NavLink>
                <NavLink href="/dashboard/projects">
                  Projects
                </NavLink>
                <NavLink href="/dashboard/groups">
                  Groups
                </NavLink>
                <NavLink href="/dashboard/team">
                  Team
                </NavLink>
                <NavLink href="/dashboard/test-sms">
                  Test SMS
                </NavLink>
              </div>
            </div>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <NavLink href="/dashboard/settings">
                  Settings
                </NavLink>
              </div>
              <div className="flex-shrink-0 ml-4">
                <span className="text-sm text-gray-700 mr-4">
                  {contractor?.name}
                </span>
              </div>
              <form action={signOut}>
                <button
                  type="submit"
                  className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      {/* Company Branding Bar */}
      {contractor?.logo_url && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center">
              <img
                src={contractor.logo_url}
                alt={contractor.company_name || 'Company logo'}
                className="h-12 w-auto object-contain"
              />
              {contractor.company_name && (
                <span className="ml-3 text-lg font-semibold text-gray-900">
                  {contractor.company_name}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      <main className="py-10">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  )
}
