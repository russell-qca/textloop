import { createClient } from '@/lib/supabase/server'
import { sendSMS } from '@/lib/twilio/client'
import { NextResponse } from 'next/server'

// Test endpoint to send a single SMS
// Only works in development
export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { to, message } = await request.json()

    if (!to || !message) {
      return NextResponse.json({ error: 'Missing required fields: to, message' }, { status: 400 })
    }

    const result = await sendSMS(to, message)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in test SMS endpoint:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
