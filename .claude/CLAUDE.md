# TextLoop - Automated Follow-Up for Contractors

## Project Overview
TextLoop is an automated SMS follow-up system for contractors. It helps them stay in touch with leads through scheduled text messages, preventing lost opportunities due to poor follow-up.

## Target User
Contractors (electricians, plumbers, general contractors, HVAC) who quote jobs and need to follow up with potential clients.

## Core Value Proposition
- Automated SMS follow-ups after sending quotes
- Simple lead management
- Increases conversion rates by ensuring consistent follow-up

## Tech Stack
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **SMS**: Twilio
- **Payments**: Stripe ($1/month subscriptions)
- **Hosting**: Vercel

## Database Schema
- `contractors`: id, email, name, company_name, phone, twilio_phone_number, subscription_status
- `leads`: id, contractor_id, client_name, client_phone, project_type, quote_amount, date_quoted, status
- `messages`: id, lead_id, message_text, sequence_day, scheduled_for, sent_at, status

## MVP Features (Week 1-4)
1. User signup/login (Supabase Auth)
2. Add lead form (client info + project details)
3. Automated 5-message sequence:
   - Day 1: Confirmation
   - Day 3: Estimate ready
   - Day 5: First follow-up
   - Day 8: Second follow-up
   - Day 12: Final follow-up
4. Dashboard showing active leads
5. Message history per lead
6. Mark leads as "Won" or "Lost"

## Message Templates
[Include the 5 message templates from earlier]

## Development Workflow
1. Build authentication first
2. Create lead management
3. Integrate Twilio for SMS
4. Add message scheduling logic
5. Build dashboard UI

## Code Standards
- Use TypeScript for type safety
- Follow Next.js 14 best practices
- Use Tailwind for styling
- Keep components small and focused
- Add error handling for all API calls