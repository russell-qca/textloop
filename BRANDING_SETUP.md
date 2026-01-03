# Company Branding Setup Guide

## Overview
This feature allows contractors to upload their company logo and add their business address in the settings page. The logo appears in the navigation bar alongside the TextLoop branding.

## Quick Setup (Recommended)

### One-Step Setup
Run the complete setup script `022_setup_complete_branding.sql` in your Supabase SQL Editor:

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your TextLoop project
3. Navigate to: **SQL Editor**
4. Copy and paste the contents of `supabase/migrations/022_setup_complete_branding.sql`
5. Click **Run**

This single script does EVERYTHING:
- Adds branding fields to `contractors` table (logo_url, street_address, address_unit, zip_code)
- Creates the `public` storage bucket
- Sets up all storage policies

After running this, you're done! Skip to the "Testing" section below.

---

## Manual Setup (Alternative)

If the automatic setup doesn't work, follow these manual steps:

### Step 1: Apply the Database Migration

Run this SQL in your Supabase SQL Editor:

```sql
ALTER TABLE contractors
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS street_address TEXT,
ADD COLUMN IF NOT EXISTS address_unit TEXT,
ADD COLUMN IF NOT EXISTS zip_code TEXT;
```

This adds the following fields to the `contractors` table:
- `logo_url` - URL to the company logo
- `street_address` - Company street address
- `address_unit` - Suite/unit number (optional)
- `zip_code` - ZIP code

**Note:** The `city` and `state` fields already exist from migration 017.

## Supabase Storage Setup

### Step 2: Create Storage Bucket

1. Go to **Storage** in your Supabase Dashboard
2. Click **New bucket**
3. Name it: `public`
4. Set as **Public bucket** (important!)
5. Click **Create bucket**

### Step 3: Set Storage Policies

The bucket needs to allow:
- Public read access (so logos can be displayed)
- Authenticated users can upload/update their logos

Run these SQL commands in the SQL Editor:

```sql
-- Allow public to read files from the public bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'public');

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'public');

-- Allow users to update their own uploaded files
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'public');
```

### Step 4: Configure File Size Limits (Optional)

By default, Supabase allows up to 50MB per file. The app enforces a 2MB limit for logos, but you can also set this at the bucket level:

1. Go to **Storage** → `public` bucket → **Configuration**
2. Set **File size limit** to `2 MB`
3. Set **Allowed MIME types** to: `image/png, image/jpeg, image/jpg, image/svg+xml`

## Features

### Settings Page
Contractors can now:
- Upload a company logo (PNG, JPG, or SVG up to 2MB)
- See a preview of their logo before/after upload
- Add their complete company address:
  - Street address
  - Unit/Suite (optional)
  - City
  - State (2-letter code)
  - ZIP code

### Navigation Bar
The dashboard navigation now displays:
- "TextLoop" app name (always visible, left side)
- Separator line
- Company logo (if uploaded)
- Company name (if set)

Layout: `TextLoop | [Company Logo] Company Name`

## Testing the Implementation

1. **Upload a Logo:**
   - Go to `/dashboard/settings`
   - Scroll to "Company Logo" section
   - Click "Choose File" and select an image
   - You should see a preview immediately
   - Click "Save Changes"
   - Verify the logo appears in the navigation bar

2. **Add Company Address:**
   - Fill in the address fields in the settings
   - Click "Save Changes"
   - Verify the data is saved (refresh the page to confirm)

3. **Verify Storage:**
   - Go to Supabase Storage → `public` bucket → `contractor-logos` folder
   - You should see your uploaded logo with a filename like: `{contractor-id}-{timestamp}.{ext}`

## File Structure

### Added/Modified Files:
- `supabase/migrations/022_add_contractor_branding.sql` - Database schema changes
- `app/dashboard/settings/settings-form.tsx` - Updated settings form with logo upload
- `app/dashboard/settings/actions.ts` - Server action to handle logo upload to Supabase Storage
- `app/dashboard/layout.tsx` - Updated to display company logo in navigation

### Storage Structure:
```
public/
  └── contractor-logos/
      ├── {contractor-id}-{timestamp}.png
      ├── {contractor-id}-{timestamp}.jpg
      └── ...
```

## Troubleshooting

### "Failed to upload logo" Error
This usually means the storage bucket hasn't been created yet. Follow these steps:

1. **Run the complete setup script** (see "Quick Setup" above)
2. **OR manually create the bucket:**
   - Go to Supabase Dashboard → Storage
   - Click "New bucket"
   - Name: `public`
   - Check "Public bucket"
   - Click "Create bucket"
3. **Set up storage policies** using the SQL from the manual setup section
4. **Try uploading again**

### Logo Not Uploading (Other Reasons)
- Check that the `public` bucket exists in Supabase Storage
- Verify storage policies are set correctly (run the policy SQL again)
- Ensure file is under 2MB and is a valid image type
- Check browser console for errors
- Check Supabase logs: Dashboard → Logs → Storage logs

### Logo Not Displaying
- Check that `logo_url` is saved in the contractors table
- Verify the URL is accessible (paste it in a browser)
- Check that storage policies allow public read access
- Clear browser cache and hard refresh

### Address Not Saving
- Verify migration 022 was applied successfully
- Check that the new columns exist: `SELECT street_address, address_unit, zip_code FROM contractors LIMIT 1;`
- Check browser console and server logs for errors

## Future Enhancements

Possible additions:
- Logo delete/remove functionality
- Image cropping tool
- Multiple logo sizes (favicon, email, etc.)
- Company color scheme customization
- Custom email templates with company branding
- PDF quote templates with logo
