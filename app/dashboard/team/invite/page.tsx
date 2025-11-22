import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'

async function inviteTeamMember(formData: FormData) {
  'use server'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get current user's role and contractor_id
  const { data: currentUser } = await supabase
    .from('users')
    .select('role, contractor_id')
    .eq('id', user.id)
    .single()

  if (!currentUser || !['owner', 'admin'].includes(currentUser.role)) {
    throw new Error('Insufficient permissions')
  }

  const email = formData.get('email') as string
  const role = formData.get('role') as string

  // Find the user by email in auth.users
  // Note: This is a simplified approach. In production, you might want to send an email invitation instead
  const { data: authUsers, error: authError } = await supabase.rpc('get_user_by_email', { user_email: email })

  if (authError) {
    // If the function doesn't exist, we need to tell the user to create it
    console.error('Error finding user:', authError)
    throw new Error('Unable to find user. They may need to sign up first.')
  }

  if (!authUsers || authUsers.length === 0) {
    throw new Error('No user found with that email. They need to sign up first.')
  }

  const userId = authUsers[0].id

  // Check if user is already in a team
  const { data: existingUser } = await supabase
    .from('users')
    .select('contractor_id')
    .eq('id', userId)
    .single()

  if (existingUser) {
    throw new Error('This user is already part of a team.')
  }

  // Add user to the team
  const { error: insertError } = await supabase
    .from('users')
    .insert({
      id: userId,
      contractor_id: currentUser.contractor_id,
      role: role
    })

  if (insertError) {
    console.error('Error adding team member:', insertError)
    throw new Error(`Failed to add team member: ${insertError.message}`)
  }

  revalidatePath('/dashboard/team')
  redirect('/dashboard/team')
}

export default async function InviteTeamMemberPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get current user's role
  const { data: currentUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!currentUser || !['owner', 'admin'].includes(currentUser.role)) {
    redirect('/dashboard/team')
  }

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/dashboard/team"
          className="text-sm text-blue-600 hover:text-blue-800 mb-4 inline-block"
        >
          ← Back to Team
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900">Invite Team Member</h1>
        <p className="mt-1 text-sm text-gray-600">
          Add a new member to your team
        </p>
      </div>

      <div className="bg-white shadow sm:rounded-lg max-w-2xl">
        <form action={inviteTeamMember} className="space-y-6 p-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> The person you're inviting must already have an account.
              Ask them to sign up at your app URL first, then enter their email address below.
            </p>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              id="email"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm text-gray-900"
              placeholder="colleague@example.com"
            />
            <p className="mt-1 text-sm text-gray-500">
              Enter the email address they used to sign up
            </p>
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
              Role *
            </label>
            <select
              name="role"
              id="role"
              required
              defaultValue="member"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm text-gray-900"
            >
              <option value="member">Member - Can create and edit data</option>
              <option value="viewer">Viewer - Read-only access</option>
              <option value="admin">Admin - Full access, can manage team</option>
              <option value="owner">Owner - Full access, can delete data</option>
            </select>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Role Permissions:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li><strong>Owner:</strong> Full access, can manage team members and delete data</li>
              <li><strong>Admin:</strong> Full access to data, can manage team members</li>
              <li><strong>Member:</strong> Can create and edit clients, quotes, and projects</li>
              <li><strong>Viewer:</strong> Read-only access to all data</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Link
              href="/dashboard/team"
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Add Team Member
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
