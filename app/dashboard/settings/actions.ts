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
    const streetAddress = formData.get('street_address') as string
    const addressUnit = formData.get('address_unit') as string
    const zipCode = formData.get('zip_code') as string
    const twilioPhoneNumber = formData.get('twilio_phone_number') as string
    const logoFile = formData.get('logo') as File | null

    // Validate required fields
    if (!name || !email) {
      return { success: false, error: 'Name and email are required' }
    }

    // Validate state is 2 letters if provided
    if (state && state.length !== 2) {
      return { success: false, error: 'State must be a 2-letter code (e.g., CA, NY, TX)' }
    }

    // Handle logo upload if a file was provided
    let logoUrl: string | undefined
    if (logoFile && logoFile.size > 0) {
      // Validate file size (max 2MB)
      if (logoFile.size > 2 * 1024 * 1024) {
        return { success: false, error: 'Logo file must be less than 2MB' }
      }

      // Validate file type
      if (!logoFile.type.startsWith('image/')) {
        return { success: false, error: 'Logo must be an image file' }
      }

      // Create a unique filename
      const fileExt = logoFile.name.split('.').pop()
      const fileName = `${contractorId}-${Date.now()}.${fileExt}`
      const filePath = `contractor-logos/${fileName}`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('public')
        .upload(filePath, logoFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Error uploading logo:', uploadError)
        return { success: false, error: 'Failed to upload logo' }
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('public')
        .getPublicUrl(filePath)

      logoUrl = publicUrl
    }

    // Prepare update object
    const updateData: any = {
      name: name.trim(),
      email: email.trim(),
      company_name: companyName.trim() || null,
      phone: phone.trim() || null,
      city: city.trim() || null,
      state: state.trim().toUpperCase() || null,
      street_address: streetAddress.trim() || null,
      address_unit: addressUnit.trim() || null,
      zip_code: zipCode.trim() || null,
      twilio_phone_number: twilioPhoneNumber.trim() || null,
      updated_at: new Date().toISOString()
    }

    // Add logo URL if it was uploaded
    if (logoUrl) {
      updateData.logo_url = logoUrl
    }

    // Update contractor record
    const { error } = await supabase
      .from('contractors')
      .update(updateData)
      .eq('id', contractorId)

    if (error) {
      console.error('Error updating contractor:', error)
      return { success: false, error: 'Failed to update settings' }
    }

    // Revalidate relevant pages (including layout for logo display)
    revalidatePath('/dashboard', 'layout')
    revalidatePath('/dashboard/settings')

    return { success: true }
  } catch (error) {
    console.error('Error in updateContractorSettings:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
