'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateContractorSettings(formData: FormData) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const contractorId = formData.get('contractor_id') as string
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const companyName = formData.get('company_name') as string
    const phone = formData.get('phone') as string
    const city = formData.get('city') as string
    const state = formData.get('state') as string
    const twilioPhoneNumber = formData.get('twilio_phone_number') as string

    // Validate required fields
    if (!name || !email) {
      return { success: false, error: 'Name and email are required' }
    }

    // Validate state is 2 letters if provided
    if (state && state.length !== 2) {
      return { success: false, error: 'State must be a 2-letter code (e.g., CA, NY, TX)' }
    }

    // Update contractor record
    const { error } = await supabase
      .from('contractors')
      .update({
        name: name.trim(),
        email: email.trim(),
        company_name: companyName.trim() || null,
        phone: phone.trim() || null,
        city: city.trim() || null,
        state: state.trim().toUpperCase() || null,
        twilio_phone_number: twilioPhoneNumber.trim() || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', contractorId)

    if (error) {
      console.error('Error updating contractor:', error)
      return { success: false, error: 'Failed to update settings' }
    }

    // Revalidate relevant pages
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/settings')

    return { success: true }
  } catch (error) {
    console.error('Error in updateContractorSettings:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
