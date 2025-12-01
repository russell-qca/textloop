import { SupabaseClient, createClient } from '@supabase/supabase-js'

/**
 * Ensures a user record exists in the users table
 * If not, creates one automatically linking them to their contractor
 */
export async function ensureUserRecord(supabase: SupabaseClient, userId: string) {
  console.log('[ensureUserRecord] Called for user:', userId)

  // Use service role from the start to bypass RLS issues
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  console.log('[ensureUserRecord] Env check:', {
    hasServiceKey: !!serviceRoleKey,
    hasUrl: !!supabaseUrl
  })

  if (!serviceRoleKey || !supabaseUrl) {
    const errorMsg = `Missing Supabase credentials - serviceKey: ${!!serviceRoleKey}, url: ${!!supabaseUrl}`
    console.error('[ensureUserRecord]', errorMsg)
    throw new Error(errorMsg)
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  // Check if user record exists using admin client
  const { data: existingUser, error: fetchError } = await adminClient
    .from('users')
    .select('id, contractor_id, role')
    .eq('id', userId)
    .maybeSingle()

  // If user exists, return it
  if (existingUser && !fetchError) {
    return existingUser
  }

  // If user doesn't exist, create one
  // First check if this user is a contractor (contractor_id matches user_id)
  const { data: contractor, error: contractorError } = await adminClient
    .from('contractors')
    .select('id')
    .eq('id', userId)
    .maybeSingle()

  // If no contractor exists, we need to create both contractor and user records
  if (!contractor) {

    // Get user email from auth
    const { data: authUser } = await adminClient.auth.admin.getUserById(userId)

    if (!authUser.user) {
      throw new Error('Auth user not found')
    }

    // Create contractor record
    const { error: contractorInsertError } = await adminClient
      .from('contractors')
      .insert({
        id: userId,
        email: authUser.user.email || '',
        name: authUser.user.user_metadata?.name || authUser.user.email?.split('@')[0] || 'User',
        subscription_status: 'active'
      })

    if (contractorInsertError && contractorInsertError.code !== '23505') {
      console.error('Error creating contractor:', contractorInsertError)
      throw new Error(`Failed to create contractor: ${contractorInsertError.message}`)
    }
  }

  // Now create the user record
  const { data: newUser, error: insertError } = await adminClient
    .from('users')
    .insert({
      id: userId,
      contractor_id: userId,
      role: 'owner'
    })
    .select()
    .single()

  if (insertError) {
    // If it's a duplicate key error, fetch the existing record (race condition)
    if (insertError.code === '23505') {
      const { data: retryUser } = await adminClient
        .from('users')
        .select('id, contractor_id, role')
        .eq('id', userId)
        .single()

      if (retryUser) {
        return retryUser
      }
    } else {
      // Only log and throw for non-duplicate errors
      console.error('Error creating user record:', insertError)
      throw new Error(`Failed to create user record: ${insertError.message}`)
    }
  }

  return newUser
}
