# Email Quote Implementation Guide

## Overview
This guide covers everything needed to add email functionality to send quotes from TextLoop to clients.

## What You Need

### 1. Email Service Provider
You'll need to choose and set up an email service. Here are the best options:

#### **Option A: Resend (RECOMMENDED for Next.js)**
- **Best for**: Modern Next.js apps
- **Pros**:
  - Built for developers, great DX
  - Official Next.js integration
  - 100 emails/day free
  - React Email support (send React components as emails)
  - Simple API
- **Cons**: Newer service (less proven than SendGrid/SES)
- **Pricing**: Free tier: 100 emails/day, 3,000/month
- **Setup time**: 10 minutes

#### **Option B: SendGrid**
- **Best for**: Reliability and scale
- **Pros**:
  - Industry standard
  - Robust analytics
  - 100 emails/day free forever
  - Great deliverability
- **Cons**: More complex setup, cluttered UI
- **Pricing**: Free tier: 100 emails/day
- **Setup time**: 20 minutes

#### **Option C: AWS SES**
- **Best for**: High volume, lowest cost
- **Pros**:
  - $0.10 per 1,000 emails (cheapest)
  - Highly scalable
  - Great if already using AWS
- **Cons**: Complex setup, requires domain verification, more technical
- **Pricing**: $0.10/1,000 emails
- **Setup time**: 30-45 minutes

#### **Option D: Postmark**
- **Best for**: Transactional emails
- **Pros**:
  - Excellent deliverability
  - Beautiful analytics
  - 100 emails/month free
- **Cons**: Smaller free tier
- **Pricing**: Free tier: 100 emails/month
- **Setup time**: 15 minutes

### 2. Domain Setup (Required for All Services)
To send professional emails from `your@textloop.com`:
- Add DNS records (SPF, DKIM, DMARC)
- Verify domain ownership
- Improves deliverability and prevents spam

**Without domain**: Emails send from provider's domain (looks unprofessional)
**With domain**: Emails send from `quotes@yourdomain.com` or `noreply@yourdomain.com`

### 3. Email Template
Need an HTML email template for the quote. Two approaches:

#### **Option A: React Email (Recommended with Resend)**
Write emails as React components:
```tsx
import { Html, Head, Body, Container, Text, Button } from '@react-email/components'

export default function QuoteEmail({ quote, client, contractor }) {
  return (
    <Html>
      <Head />
      <Body>
        <Container>
          <Text>Hi {client.name},</Text>
          <Text>Thank you for requesting a quote from {contractor.company}!</Text>
          <Text>Quote Amount: ${quote.amount}</Text>
          <Button href={`https://textloop.com/quotes/${quote.id}`}>
            View Quote
          </Button>
        </Container>
      </Body>
    </Html>
  )
}
```

#### **Option B: Plain HTML Template**
Traditional HTML string with variables:
```html
<!DOCTYPE html>
<html>
  <body>
    <h2>Quote from {{company_name}}</h2>
    <p>Hi {{client_name}},</p>
    <p>Your quote for {{quote_title}} is ready!</p>
    <p><strong>Amount: ${{quote_amount}}</strong></p>
  </body>
</html>
```

### 4. Code Implementation

#### **What needs to be added:**

1. **Environment Variables** (`.env.local`)
   ```bash
   # For Resend
   RESEND_API_KEY=re_xxxxxxxxxxxx

   # For SendGrid
   SENDGRID_API_KEY=SG.xxxxxxxxxxxx

   # For AWS SES
   AWS_ACCESS_KEY_ID=xxxxxxxxxxxx
   AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxx
   AWS_REGION=us-east-1
   ```

2. **NPM Package**
   ```bash
   # For Resend
   npm install resend

   # For SendGrid
   npm install @sendgrid/mail

   # For AWS SES
   npm install @aws-sdk/client-ses

   # Optional: React Email for nice templates
   npm install react-email @react-email/components
   ```

3. **Email Service Utility** (`lib/email.ts`)
   ```typescript
   import { Resend } from 'resend'

   const resend = new Resend(process.env.RESEND_API_KEY)

   export async function sendQuoteEmail({
     to,
     quote,
     client,
     contractor
   }) {
     const { data, error } = await resend.emails.send({
       from: 'quotes@textloop.com',
       to: to,
       subject: `Quote from ${contractor.company_name}`,
       html: renderQuoteEmailTemplate(quote, client, contractor)
     })

     if (error) {
       throw error
     }

     return data
   }
   ```

4. **Server Action** (add to quote detail page)
   ```typescript
   async function sendQuoteByEmail(quoteId: string) {
     'use server'

     const supabase = await createClient()
     const { data: { user } } = await supabase.auth.getUser()

     if (!user) redirect('/login')

     // Get quote with client info
     const { data: quote } = await supabase
       .from('quotes')
       .select('*, clients(*), contractors(*)')
       .eq('id', quoteId)
       .single()

     if (!quote || !quote.clients.client_email) {
       return { error: 'Client email not found' }
     }

     try {
       await sendQuoteEmail({
         to: quote.clients.client_email,
         quote,
         client: quote.clients,
         contractor: quote.contractors
       })

       return { success: true }
     } catch (error) {
       return { error: error.message }
     }
   }
   ```

5. **UI Button** (on quote detail page)
   ```tsx
   <button
     onClick={() => sendQuoteByEmail(quote.id)}
     disabled={!quote.clients.client_email}
     className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
   >
     Email to Client
   </button>
   ```

## Implementation Steps

### Quick Start (Using Resend - Recommended)

**Total Time: ~30 minutes**

#### Step 1: Create Resend Account (5 min)
1. Go to [resend.com](https://resend.com)
2. Sign up (free)
3. Create API key
4. Copy API key to `.env.local`:
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxx
   ```

#### Step 2: Install Package (1 min)
```bash
npm install resend
```

#### Step 3: Create Email Utility (10 min)
Create `lib/email.ts`:
```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendQuoteEmailParams {
  to: string
  quoteTitle: string
  quoteAmount: number
  clientName: string
  companyName: string
  dateQuoted: string
  validUntil?: string
}

export async function sendQuoteEmail({
  to,
  quoteTitle,
  quoteAmount,
  clientName,
  companyName,
  dateQuoted,
  validUntil
}: SendQuoteEmailParams) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9fafb; padding: 30px; }
          .quote-details { background-color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .amount { font-size: 32px; color: #2563eb; font-weight: bold; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${companyName}</h1>
            <p>Your Quote is Ready</p>
          </div>
          <div class="content">
            <p>Hi ${clientName},</p>
            <p>Thank you for your interest! We're pleased to provide you with a quote for your project.</p>

            <div class="quote-details">
              <h2>${quoteTitle || 'Quote Details'}</h2>
              <p class="amount">$${quoteAmount.toLocaleString()}</p>
              <p><strong>Date:</strong> ${new Date(dateQuoted).toLocaleDateString()}</p>
              ${validUntil ? `<p><strong>Valid Until:</strong> ${new Date(validUntil).toLocaleDateString()}</p>` : ''}
            </div>

            <p>If you have any questions about this quote, please don't hesitate to reach out.</p>
            <p>We look forward to working with you!</p>

            <p>Best regards,<br>${companyName}</p>
          </div>
          <div class="footer">
            <p>This is an automated email from ${companyName}</p>
          </div>
        </div>
      </body>
    </html>
  `

  const { data, error } = await resend.emails.send({
    from: 'quotes@yourdomain.com', // Change to your domain
    to: to,
    subject: `Quote from ${companyName}`,
    html: html
  })

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`)
  }

  return data
}
```

#### Step 4: Add Server Action (5 min)
Add to `/app/dashboard/quotes/[id]/page.tsx`:
```typescript
import { sendQuoteEmail } from '@/lib/email'

async function emailQuote(quoteId: string) {
  'use server'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Get quote with all details
  const { data: quote } = await supabase
    .from('quotes')
    .select(`
      *,
      clients (client_name, client_email),
      contractors (company_name)
    `)
    .eq('id', quoteId)
    .eq('contractor_id', user.id)
    .single()

  if (!quote) {
    return { error: 'Quote not found' }
  }

  if (!quote.clients.client_email) {
    return { error: 'Client email address not found' }
  }

  try {
    await sendQuoteEmail({
      to: quote.clients.client_email,
      quoteTitle: quote.quote_title,
      quoteAmount: quote.quote_amount,
      clientName: quote.clients.client_name,
      companyName: quote.contractors.company_name,
      dateQuoted: quote.date_quoted,
      validUntil: quote.valid_until
    })

    revalidatePath(`/dashboard/quotes/${quoteId}`)
    return { success: true }
  } catch (error) {
    console.error('Email send error:', error)
    return { error: 'Failed to send email' }
  }
}
```

#### Step 5: Add UI Component (5 min)
Create `/app/components/email-quote-button.tsx`:
```tsx
'use client'

import { useState } from 'react'

interface EmailQuoteButtonProps {
  quoteId: string
  clientEmail: string | null
  onSend: (quoteId: string) => Promise<{ success?: boolean; error?: string }>
}

export default function EmailQuoteButton({
  quoteId,
  clientEmail,
  onSend
}: EmailQuoteButtonProps) {
  const [isSending, setIsSending] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function handleSend() {
    setIsSending(true)
    setMessage(null)

    const result = await onSend(quoteId)

    if (result.success) {
      setMessage({ type: 'success', text: 'Quote emailed successfully!' })
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to send email' })
    }

    setIsSending(false)

    // Clear message after 3 seconds
    setTimeout(() => setMessage(null), 3000)
  }

  return (
    <div>
      <button
        onClick={handleSend}
        disabled={!clientEmail || isSending}
        className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSending ? 'Sending...' : 'Email to Client'}
      </button>

      {!clientEmail && (
        <p className="mt-2 text-xs text-red-600">Client email address required</p>
      )}

      {message && (
        <div className={`mt-2 text-sm ${
          message.type === 'success' ? 'text-green-600' : 'text-red-600'
        }`}>
          {message.text}
        </div>
      )}
    </div>
  )
}
```

#### Step 6: Add to Quote Detail Page (2 min)
In the quote detail page sidebar, add:
```tsx
import EmailQuoteButton from '@/app/components/email-quote-button'

// In the sidebar actions section:
<EmailQuoteButton
  quoteId={quote.id}
  clientEmail={quote.clients?.client_email}
  onSend={emailQuote}
/>
```

#### Step 7: Test (5 min)
1. Make sure client has an email address
2. Click "Email to Client" button
3. Check inbox (and spam folder!)

## Advanced Features (Optional)

### 1. PDF Attachment
Install: `npm install puppeteer html-pdf-node`

Generate PDF from HTML and attach to email:
```typescript
import pdf from 'html-pdf-node'

const file = { content: htmlTemplate }
const pdfBuffer = await pdf.generatePdf(file, { format: 'A4' })

await resend.emails.send({
  // ... other fields
  attachments: [{
    filename: 'quote.pdf',
    content: pdfBuffer
  }]
})
```

### 2. Email Tracking
Track when client opens the email:
- Resend provides analytics
- Or use tracking pixel in template

### 3. Custom Templates per Contractor
Store email templates in database:
```sql
ALTER TABLE contractors
ADD COLUMN email_template TEXT;
```

### 4. Email History/Log
Track all sent emails:
```sql
CREATE TABLE email_logs (
  id UUID PRIMARY KEY,
  quote_id UUID REFERENCES quotes(id),
  recipient TEXT,
  sent_at TIMESTAMP,
  status TEXT
);
```

## Cost Breakdown

### Free Tier Comparison
| Service | Free Tier | After Free Tier |
|---------|-----------|----------------|
| Resend | 100/day, 3k/month | $20/month for 50k |
| SendGrid | 100/day forever | $15/month for 40k |
| AWS SES | None | $0.10 per 1k |
| Postmark | 100/month | $10/month for 10k |

### Estimated Costs for TextLoop
- **10 quotes/day** = 300/month → FREE on any service
- **50 quotes/day** = 1,500/month → FREE on Resend/SendGrid
- **200 quotes/day** = 6,000/month → $20/month (Resend) or $15/month (SendGrid)

## Common Issues & Solutions

### Issue: Emails go to spam
**Solution**:
- Set up SPF, DKIM, DMARC records
- Use verified domain
- Avoid spam trigger words
- Include unsubscribe link

### Issue: Email doesn't send
**Solution**:
- Check API key is correct
- Verify client email exists
- Check error logs
- Test with personal email first

### Issue: Rate limiting
**Solution**:
- Implement queue system
- Space out bulk sends
- Upgrade plan if needed

## Next Steps After Email Works

1. **Add email preview** - Show what email looks like before sending
2. **CC yourself** - Get copy of every quote sent
3. **Custom message** - Let user add personal note
4. **Follow-up reminders** - Notify if quote not opened in 3 days
5. **Response tracking** - Track when client responds

## Recommended Approach

**For TextLoop, I recommend:**
1. **Start with Resend** (easiest, modern, great DX)
2. **Use simple HTML template** (no need for React Email initially)
3. **Add "Email Quote" button** to quote detail page
4. **Total implementation time**: 30-45 minutes
5. **Cost**: $0 (free tier covers most contractors)

## Want Me to Implement It?

I can build this for you if you'd like! Just let me know:
1. Which email service you prefer (I recommend Resend)
2. Whether you have a domain for sending emails
3. If you want PDF attachment feature
4. Any specific branding/template requirements

The basic implementation would take about 30-45 minutes total!
