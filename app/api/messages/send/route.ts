import { createClient } from '@/lib/supabase/server'
import { sendSMS } from '@/lib/twilio/client'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    // Verify the request has a valid authorization header (for cron jobs)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // Get all pending messages that are due to be sent
    const now = new Date().toISOString()
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        *,
        leads!inner (
          client_phone,
          status,
          contractor_id
        )
      `)
      .eq('status', 'pending')
      .lte('scheduled_for', now)
      .eq('leads.status', 'active') // Only send messages for active leads

    if (error) {
      console.error('Error fetching messages:', error)
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }

    if (!messages || messages.length === 0) {
      return NextResponse.json({ message: 'No messages to send', sent: 0 })
    }

    const results = []

    for (const message of messages) {
      const lead = message.leads as any

      try {
        // Send the SMS
        const result = await sendSMS(lead.client_phone, message.message_text)

        if (result.success) {
          // Update message status to sent
          await supabase
            .from('messages')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
            })
            .eq('id', message.id)

          results.push({ id: message.id, status: 'sent' })
        } else {
          // Update message status to failed
          await supabase
            .from('messages')
            .update({ status: 'failed' })
            .eq('id', message.id)

          results.push({ id: message.id, status: 'failed', error: result.error })
        }
      } catch (error) {
        console.error(`Error sending message ${message.id}:`, error)
        await supabase
          .from('messages')
          .update({ status: 'failed' })
          .eq('id', message.id)

        results.push({
          id: message.id,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    return NextResponse.json({
      message: 'Messages processed',
      sent: results.filter((r) => r.status === 'sent').length,
      failed: results.filter((r) => r.status === 'failed').length,
      results,
    })
  } catch (error) {
    console.error('Error in send messages endpoint:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
