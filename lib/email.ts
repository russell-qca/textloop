import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface QuoteItem {
  id: string
  name: string
  description: string
  quantity: number
  unit_price: number
  sort_order: number
}

interface SendQuoteEmailParams {
  to: string
  quoteTitle: string | null
  quoteSummary: string | null
  quoteDescription: string | null
  quoteAmount: number
  clientName: string
  companyName: string
  dateQuoted: string
  validUntil?: string | null
  acceptanceToken: string
  siteUrl: string
  quoteItems?: QuoteItem[]
}

export async function sendQuoteEmail({
  to,
  quoteTitle,
  quoteSummary,
  quoteDescription,
  quoteAmount,
  clientName,
  companyName,
  dateQuoted,
  validUntil,
  acceptanceToken,
  siteUrl,
  quoteItems = []
}: SendQuoteEmailParams) {
  const acceptUrl = `${siteUrl}/accept-quote/${acceptanceToken}`
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f3f4f6;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
          }
          .header {
            background-color: #2563eb;
            color: white;
            padding: 32px 24px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .header p {
            margin: 8px 0 0 0;
            font-size: 16px;
            opacity: 0.9;
          }
          .content {
            padding: 32px 24px;
          }
          .greeting {
            font-size: 16px;
            margin-bottom: 16px;
          }
          .quote-details {
            background-color: #f9fafb;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            padding: 24px;
            margin: 24px 0;
          }
          .quote-details h2 {
            margin: 0 0 16px 0;
            font-size: 20px;
            color: #1f2937;
          }
          .amount {
            font-size: 36px;
            color: #2563eb;
            font-weight: bold;
            margin: 16px 0;
          }
          .detail-row {
            margin: 12px 0;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .detail-row:last-child {
            border-bottom: none;
          }
          .detail-label {
            font-weight: 600;
            color: #6b7280;
            font-size: 14px;
          }
          .detail-value {
            color: #1f2937;
            font-size: 15px;
            margin-top: 4px;
          }
          .description {
            background-color: #ffffff;
            border-left: 4px solid #2563eb;
            padding: 16px;
            margin: 16px 0;
            white-space: pre-wrap;
            color: #4b5563;
          }
          .footer {
            text-align: center;
            padding: 24px;
            color: #6b7280;
            font-size: 14px;
            border-top: 1px solid #e5e7eb;
          }
          .footer p {
            margin: 4px 0;
          }
          .accept-button {
            display: inline-block;
            background-color: #10b981;
            color: #ffffff !important;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 8px;
          }
          .accept-button:hover {
            background-color: #059669;
            color: #ffffff !important;
          }
          .decline-button {
            display: inline-block;
            background-color: #6b7280;
            color: #ffffff !important;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 8px;
          }
          .decline-button:hover {
            background-color: #4b5563;
            color: #ffffff !important;
          }
          .button-container {
            text-align: center;
            margin: 32px 0;
          }
          .buttons-row {
            display: flex;
            justify-content: center;
            align-items: center;
            flex-wrap: wrap;
          }
          .line-item {
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 16px;
            margin-bottom: 12px;
          }
          .line-item-header {
            margin-bottom: 8px;
          }
          .line-item-title {
            font-size: 14px;
            font-weight: 600;
            color: #4b5563;
          }
          .line-item-total {
            font-size: 14px;
            font-weight: 600;
            color: #1f2937;
            margin-left: 8px;
          }
          .line-item-description {
            font-size: 14px;
            color: #4b5563;
            margin-bottom: 8px;
          }
          .line-item-details {
            font-size: 12px;
            color: #6b7280;
          }
          .quote-total-box {
            background-color: #eff6ff;
            border: 2px solid #bfdbfe;
            border-radius: 8px;
            padding: 20px;
            margin-top: 16px;
          }
          .quote-total-row {
            text-align: left;
          }
          .quote-total-label {
            font-size: 20px;
            font-weight: 600;
            color: #1f2937;
          }
          .quote-total-amount {
            font-size: 20px;
            font-weight: 600;
            color: #2563eb;
            margin-left: 8px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${companyName}</h1>
            <p>Your Quote is Ready</p>
          </div>

          <div class="content">
            <p class="greeting">Hi ${clientName},</p>

            <p>Thank you for your interest in working with us! We're pleased to provide you with a quote for your project.</p>

            <div class="quote-details">
              <h2>${quoteTitle || 'Quote Details'}</h2>

              ${quoteSummary ? `<p style="color: #4b5563; margin-bottom: 16px;">${quoteSummary}</p>` : ''}

              ${quoteItems && quoteItems.length > 0 ? `
                <h3 style="font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 12px;">Quote Breakdown</h3>
                ${quoteItems.map((item, index) => `
                  <div class="line-item">
                    <div class="line-item-header">
                      <span class="line-item-title">${item.name}:</span>
                      <span class="line-item-total">$${(item.quantity * item.unit_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    ${item.description ? `<div class="line-item-description">${item.description}</div>` : ''}
                    <div class="line-item-details">
                      Quantity: ${item.quantity} × $${item.unit_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} each
                    </div>
                  </div>
                `).join('')}
                <div class="quote-total-box">
                  <div class="quote-total-row">
                    <span class="quote-total-label">Total Quote Amount:</span>
                    <span class="quote-total-amount">$${quoteAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              ` : `
                <div class="amount">$${quoteAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              `}

              <div class="detail-row">
                <div class="detail-label">Date Quoted</div>
                <div class="detail-value">${new Date(dateQuoted).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              </div>

              ${validUntil ? `
                <div class="detail-row">
                  <div class="detail-label">Valid Until</div>
                  <div class="detail-value">${new Date(validUntil).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </div>
              ` : ''}
            </div>

            ${quoteDescription ? `
              <div class="description">
                ${quoteDescription}
              </div>
            ` : ''}

            <div class="button-container">
              <div class="buttons-row">
                <a href="${acceptUrl}" class="decline-button">
                  Decline Quote
                </a>
                <a href="${acceptUrl}" class="accept-button">
                  Accept Quote
                </a>
              </div>
            </div>

            <p style="text-align: center; color: #6b7280; font-size: 14px; margin-bottom: 24px;">
              Or copy and paste this link into your browser to view and respond:<br>
              <span style="color: #2563eb;">${acceptUrl}</span>
            </p>

            <p>If you have any questions about this quote or would like to discuss the project further, please don't hesitate to reach out. We're here to help!</p>

            <p>We look forward to the opportunity to work with you.</p>

            <p style="margin-top: 24px;">
              Best regards,<br>
              <strong>${companyName}</strong>
            </p>
          </div>

          <div class="footer">
            <p>This quote was sent from ${companyName}</p>
            <p style="color: #9ca3af; font-size: 12px;">Powered by TextLoop</p>
          </div>
        </div>
      </body>
    </html>
  `

  try {
    const { data, error } = await resend.emails.send({
      from: 'TextLoop <onboarding@resend.dev>', // Will use Resend's domain initially
      to: to,
      subject: `Quote from ${companyName}`,
      html: html,
    })

    if (error) {
      throw new Error(`Failed to send email: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error('Email send error:', error)
    throw error
  }
}
