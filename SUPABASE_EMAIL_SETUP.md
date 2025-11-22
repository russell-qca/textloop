# Supabase Email Template Setup Guide

## Overview
Supabase uses email templates to send authentication-related emails like password resets, email confirmations, and magic links. This guide covers setting up password reset emails for TextLoop.

## Step 1: Access Email Templates

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your TextLoop project
3. Navigate to: **Authentication** → **Email Templates** (in the left sidebar)

## Step 2: Configure the "Reset Password" Template

You'll see several email templates. Click on **"Reset Password"** or **"Change Email Address"** (depending on your Supabase version).

### Default Template Structure

The default Supabase password reset email template looks like this:

```html
<h2>Reset Password</h2>

<p>Follow this link to reset the password for your user:</p>
<p><a href="{{ .SiteURL }}/auth/v1/verify?token={{ .TokenHash }}&type=recovery&redirect_to={{ .RedirectTo }}">Reset Password</a></p>
```

### What You Need to Change

Replace the default template with one customized for TextLoop:

```html
<h2>Reset Your TextLoop Password</h2>

<p>Hi there,</p>

<p>We received a request to reset your password for your TextLoop contractor account.</p>

<p>Click the button below to reset your password:</p>

<p>
  <a href="{{ .ConfirmationURL }}"
     style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500;">
    Reset Password
  </a>
</p>

<p>Or copy and paste this link into your browser:</p>
<p>{{ .ConfirmationURL }}</p>

<p><strong>This link will expire in 1 hour.</strong></p>

<p>If you didn't request a password reset, you can safely ignore this email.</p>

<p>Thanks,<br>The TextLoop Team</p>

<hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;">

<p style="font-size: 12px; color: #6b7280;">
  If you're having trouble clicking the button, copy and paste the URL below into your web browser:
  <br>
  {{ .ConfirmationURL }}
</p>
```

### Important Template Variables

Supabase provides these variables you can use in your template:

- **`{{ .ConfirmationURL }}`** - The complete reset URL (RECOMMENDED - includes all necessary parameters)
- **`{{ .Token }}`** - Raw token string
- **`{{ .TokenHash }}`** - Hashed token
- **`{{ .SiteURL }}`** - Your site URL from Supabase settings
- **`{{ .RedirectTo }}`** - The redirect URL you specified in code
- **`{{ .Email }}`** - User's email address

**Best Practice:** Use `{{ .ConfirmationURL }}` instead of manually constructing the URL. It's more reliable and handles all parameters correctly.

## Step 3: Configure Site URL and Redirect URLs

### Site URL
1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL** to match your environment:
   - **Production**: `https://yourdomain.com` (e.g., `https://textloop.vercel.app`)
   - **Local Development**: `http://localhost:3000`

### Redirect URLs
Add allowed redirect URLs to prevent security issues:

1. In the same **URL Configuration** page
2. Under **Redirect URLs**, add:
   ```
   http://localhost:3000/reset-password
   https://yourdomain.com/reset-password
   https://*.vercel.app/reset-password
   ```

**Note:** Use `*` wildcards for Vercel preview deployments (e.g., `https://*.vercel.app`)

## Step 4: Configure Email Settings

### SMTP Settings (Optional but Recommended for Production)

By default, Supabase sends emails from their servers, but they have rate limits. For production, set up your own SMTP:

1. Go to **Project Settings** → **Auth** → **SMTP Settings**
2. Enable custom SMTP
3. Configure your email provider:

#### Using SendGrid:
```
Host: smtp.sendgrid.net
Port: 587
Username: apikey
Password: YOUR_SENDGRID_API_KEY
Sender email: noreply@yourdomain.com
Sender name: TextLoop
```

#### Using Gmail (for testing only):
```
Host: smtp.gmail.com
Port: 587
Username: your-email@gmail.com
Password: YOUR_APP_PASSWORD (not your Gmail password)
Sender email: your-email@gmail.com
Sender name: TextLoop
```

#### Using AWS SES:
```
Host: email-smtp.us-east-1.amazonaws.com
Port: 587
Username: YOUR_SES_SMTP_USERNAME
Password: YOUR_SES_SMTP_PASSWORD
Sender email: noreply@yourdomain.com
Sender name: TextLoop
```

### Email Rate Limits

**Supabase Default SMTP:**
- Hourly: 30 emails
- Daily: 100 emails

**Custom SMTP:**
- Depends on your provider
- SendGrid Free: 100 emails/day
- AWS SES: 200 emails/day (free tier)

## Step 5: Test the Password Reset Flow

### Local Testing:

1. Start your Next.js dev server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000/login`

3. Click "Forgot your password?"

4. Enter a test email (must be a real email you can access)

5. Check your email inbox (and spam folder!)

6. Click the reset link in the email

7. You should be redirected to `http://localhost:3000/reset-password`

8. Enter a new password and submit

### Common Issues and Solutions:

#### Email Not Received
- **Check spam folder** - Supabase emails often go to spam
- **Verify email exists** - The email must be registered in your system
- **Check Supabase logs** - Go to **Logs** → **Auth** to see if email was sent
- **Rate limit exceeded** - Check if you've exceeded the hourly limit

#### Invalid or Expired Link
- Links expire after **1 hour** by default
- Can't reuse the same link - request a new one
- Check URL configuration matches your environment

#### Redirect Issues
- Ensure redirect URL is in the allowed list
- Check that `Site URL` is set correctly
- Verify the code passes the correct `redirectTo` parameter

## Step 6: Customize Other Email Templates (Optional)

While you're in the email templates section, you might want to customize:

### Confirm Signup
Sent when new users register (if email confirmation is enabled):
```html
<h2>Welcome to TextLoop!</h2>
<p>Thanks for signing up! Click the link below to confirm your email:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm Email</a></p>
```

### Magic Link
If you want to add passwordless login in the future:
```html
<h2>Your TextLoop Magic Link</h2>
<p>Click below to sign in to your account:</p>
<p><a href="{{ .ConfirmationURL }}">Sign In</a></p>
```

## Step 7: Environment-Specific Configuration

### For Development (.env.local):
```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### For Production (Vercel):
1. Go to your Vercel project settings
2. Add the same environment variables
3. Update Supabase **Site URL** to your Vercel domain
4. Add Vercel domain to **Redirect URLs**

## Security Best Practices

1. **Always use HTTPS in production** - Never send reset links over HTTP
2. **Keep token expiration short** - Default 1 hour is good
3. **Use strong passwords** - Enforce minimum 6 characters (your code already does this)
4. **Monitor failed attempts** - Check Supabase logs for suspicious activity
5. **Use custom SMTP** - More reliable and professional
6. **Whitelist redirect URLs** - Prevent open redirect vulnerabilities

## Testing Checklist

- [ ] Email arrives in inbox (or spam)
- [ ] Reset link redirects to correct page
- [ ] Invalid/expired link shows error message
- [ ] New password is accepted
- [ ] Can login with new password
- [ ] Old password no longer works
- [ ] Email uses your branding/styling

## Additional Resources

- [Supabase Auth Emails Documentation](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Supabase Email Rate Limits](https://supabase.com/docs/guides/platform/going-into-prod#auth-rate-limits)
- [Custom SMTP Configuration](https://supabase.com/docs/guides/auth/auth-smtp)

## Need Help?

If you run into issues:
1. Check Supabase Dashboard → **Logs** → **Auth Logs**
2. Look for error messages in your Next.js console
3. Verify all URLs match between code and Supabase settings
4. Test with a different email address
5. Try requesting a new reset link (links are single-use)
