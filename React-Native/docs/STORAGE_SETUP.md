# Course Resources Storage Setup Guide

This guide will help you set up the `course-resources` bucket in Supabase, which is required to store and access course resources like PDFs and videos.

## 1. Create the Course Resources Bucket

### Option A: Using the Supabase UI (Recommended for beginners)

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New Bucket**
4. Enter the following details:
   - Bucket name: `course-resources` (must match exactly)
   - Check the box for **Public bucket** to allow public access
5. Click **Create bucket**

### Option B: Using SQL (For advanced users)

You can run the following SQL in the Supabase SQL Editor:

```sql
-- Create the course-resources bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-resources', 'course-resources', true)
ON CONFLICT (id) DO NOTHING;
```

## 2. Set Up Storage Policies

### Option A: Using the Supabase UI

1. Navigate to the **Storage** section in the Supabase dashboard
2. Select the `course-resources` bucket
3. Go to the **Policies** tab
4. Click **New Policy** and create the following policies:

   a. **Public can view all course resources**
      - Policy name: Public can view all course resources
      - Allowed operation: SELECT
      - Target roles: public
      - Using expression: `bucket_id = 'course-resources'`

   b. **Users can upload course resources**
      - Policy name: Users can upload course resources
      - Allowed operation: INSERT
      - Target roles: authenticated
      - Using expression: `bucket_id = 'course-resources'`

   c. **Users can update course resources**
      - Policy name: Users can update course resources
      - Allowed operation: UPDATE
      - Target roles: authenticated
      - Using expression: `bucket_id = 'course-resources'`

   d. **Users can delete course resources**
      - Policy name: Users can delete course resources
      - Allowed operation: DELETE
      - Target roles: authenticated
      - Using expression: `bucket_id = 'course-resources'`

### Option B: Using SQL (For advanced users)

You can run the SQL script in `supabase/migration/create_buckets.sql` which contains all the necessary policies.

## 3. Testing the Storage Setup

We've included a test script to verify your storage setup. Follow these steps:

1. Make sure your Supabase credentials are correct in `lib/Superbase.ts`
2. Open a terminal and run:

```bash
cd React-Native
node utils/testBucketAccess.js
```

The script will perform the following tests:
- Check if the `course-resources` bucket exists
- List files in the bucket
- Upload a test PDF file to the bucket
- Get a public URL for the file
- Create a signed URL for the file
- Delete the test file

If all tests pass, you'll see a "All tests passed!" message. If any tests fail, the script will show an error message with details about what went wrong.

## 4. Common Issues and Solutions

### Error: "course-resources bucket NOT found"
- Make sure you've created the bucket with the exact name "course-resources"
- Check your Supabase credentials in `lib/Superbase.ts`

### Error: "Failed to upload test file: Permission denied"
- Verify that the bucket policies are correctly set up
- Make sure you're authenticated (if testing from the app)

### Error: "Resource file not found in storage"
- The resource path might be incorrect
- The file might have been deleted

## 5. Understanding Resource URLs

Course resources have two types of URLs:

1. **Public URLs**: Always accessible, no expiration
   - Format: `https://{project-ref}.supabase.co/storage/v1/object/public/course-resources/{path}`
   - Use `getResourcePublicUrl()` to get these URLs

2. **Signed URLs**: Expire after a specified time
   - Format: `https://{project-ref}.supabase.co/storage/v1/object/sign/course-resources/{path}?token=...`
   - Use `getResourceSignedUrl()` to get these URLs

## 6. Working with Course Resources in the App

The app includes utility functions in `utils/resourceUtils.ts` to handle course resources:

- **uploadResource(courseId, moduleId)**: Upload a file and get a Resource object
- **getResourcePublicUrl(path)**: Get a public URL for a resource
- **getResourceSignedUrl(path, expiresIn)**: Get a signed URL with an expiration time
- **checkResourceExists(path)**: Check if a resource exists in storage

## 7. Next Steps

Once your storage is set up:

1. Make sure `ResourceViewer.tsx` is using the utility functions correctly
2. Test uploading and viewing resources in the app
3. Check that published courses can display resources properly

For additional help, check the [Supabase Storage documentation](https://supabase.com/docs/guides/storage). 