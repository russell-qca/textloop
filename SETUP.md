# TextLoop - Setup Guide

## What You've Built

TextLoop is an automated SMS follow-up system for contractors that:
- Allows contractors to add leads with client information
- Automatically schedules a 5-message SMS sequence (Days 1, 3, 5, 8, 12)
- Tracks lead status (active, won, lost)
- Sends SMS messages via Twilio
- Manages subscriptions via Stripe

## Current Status

✅ **Completed:**
- Authentication (signup/login with Supabase)
- Dashboard with lead statistics
- Add new leads with full address fields
- Automatic message scheduling
- Individual lead detail pages
- Update lead status (won/lost)
- View scheduled messages
- Twilio SMS integration
- API routes for sending messages

🚧 **Not Yet Implemented:**
- Stripe subscription integration
- Automated cron job (needs deployment to Vercel)
- Email notifications

---

## Setup Instructions

### 1. Environment Variables

Add these to your `.env.local` file:

```bash
# Supabase (✅ Already configured)
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
SUPABASE_SERVICE_ROLE_KEY=your-key

# Twilio (⚠️ Add these if you want SMS)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Stripe (⚠️ Add later for payments)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...

# App Settings
NEXT_PUBLIC_APP_URL=http://localhost:3001
CRON_SECRET=generate-a-random-string-here
```

### 2. Twilio Setup (Optional for MVP Testing)

If you want to test SMS sending:

1. Go to https://www.twilio.com/try-twilio
2. Sign up for a free account ($15 credit)
3. Get your credentials from the Console Dashboard:
   - Account SID
   - Auth Token
4. Get a phone number:
   - Go to Phone Numbers > Manage > Buy a number
   - Select a number with SMS capabilities
5. Add credentials to `.env.local`

**Note:** With a trial account, you can only send SMS to verified phone numbers. Add your phone in the Twilio console under Phone Numbers > Verified Caller IDs.

### 3. Supabase Configuration

You've already run the main schema. Make sure you also ran:

```sql
CREATE POLICY "Contractors can insert own data"
  ON contractors FOR INSERT
  WITH CHECK (auth.uid()::text = id::text);
```

And disabled email confirmation in **Authentication > Settings > Email Auth**.

---

## Testing the Application

### Test Flow:

1. **Sign up** at http://localhost:3001
2. **Add a lead** from the dashboard
3. **View the lead** by clicking on it
4. **Check messages** - You should see 5 scheduled messages
5. **Mark as won/lost** using the action buttons

### Testing SMS (if Twilio is configured):

You can manually trigger message sending for testing:

```bash
# Add CRON_SECRET to your .env.local first
CRON_SECRET=my-secret-key

# Then call the API
curl -X POST http://localhost:3001/api/messages/send \
  -H "Authorization: Bearer my-secret-key"
```

This will send any messages that are scheduled for now or earlier.

---

## Production Deployment

### Deploy to Vercel:

1. Push your code to GitHub
2. Connect to Vercel
3. Add all environment variables
4. Deploy!

### Set Up Cron Job:

After deploying to Vercel, set up a cron job:

1. Go to https://cron-job.org or use Vercel Cron
2. Create a job that hits: `https://your-app.vercel.app/api/messages/send`
3. Set it to run every hour (or every 15 minutes)
4. Add header: `Authorization: Bearer YOUR_CRON_SECRET`

---

## API Endpoints

### POST `/api/messages/send`
Sends all pending messages that are due.

**Headers:**
```
Authorization: Bearer YOUR_CRON_SECRET
```

**Response:**
```json
{
  "message": "Messages processed",
  "sent": 3,
  "failed": 0,
  "results": [...]
}
```

### POST `/api/messages/test` (Development only)
Test sending a single SMS.

**Body:**
```json
{
  "to": "+1234567890",
  "message": "Test message"
}
```

---

## Database Schema

### Tables:

1. **contractors** - User accounts
2. **leads** - Client/lead information
3. **messages** - Scheduled SMS messages

### Message Sequence:

- Day 1: Confirmation
- Day 3: Estimate ready
- Day 5: First follow-up
- Day 8: Second follow-up
- Day 12: Final follow-up

---

## Next Steps

1. **Test the lead flow** - Add a few test leads
2. **Configure Twilio** - If you want to send real SMS
3. **Add Stripe** - When ready for subscriptions
4. **Deploy to Vercel** - For production use
5. **Set up cron job** - For automated message sending

---

## Troubleshooting

### Messages not sending?
- Check Twilio credentials in `.env.local`
- Verify your Twilio account has credit
- Check that phone numbers are verified (trial accounts)

### Lead status not updating?
- Check browser console for errors
- Verify RLS policies are set up correctly

### Can't sign up?
- Make sure email confirmation is disabled in Supabase
- Check that the INSERT policy exists for contractors table

---

## Support

For issues or questions, check:
- Supabase dashboard for database errors
- Browser console for frontend errors
- Server logs for API errors
