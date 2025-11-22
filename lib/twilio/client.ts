import twilio from 'twilio'

export function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN

  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials are not configured')
  }

  return twilio(accountSid, authToken)
}

export async function sendSMS(to: string, message: string) {
  const client = getTwilioClient()
  const from = process.env.TWILIO_PHONE_NUMBER

  if (!from) {
    throw new Error('Twilio phone number is not configured')
  }

  try {
    const result = await client.messages.create({
      body: message,
      from,
      to,
    })

    return { success: true, messageId: result.sid }
  } catch (error) {
    console.error('Twilio error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
