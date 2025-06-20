# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
    npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

## Course Resources Storage Setup

To properly handle course resources (PDF, videos, etc.), follow these steps:

1. **Create the course-resources bucket in Supabase**
   - Go to your Supabase project
   - Navigate to Storage in the sidebar
   - Click "New bucket" 
   - Name it "course-resources" (must match exactly)
   - Enable "Public bucket" for public access 
   - Click "Create bucket"

2. **Configure Storage Policies**
   - After creating the bucket, go to the "Policies" tab
   - Ensure the following policies are set:
     - Public can view all course resources
     - Authenticated users can upload course resources
     - Authenticated users can update course resources
     - Authenticated users can delete course resources

3. **Test Bucket Configuration**
   - Run the test script to verify your setup:
   ```bash
   cd React-Native
   node utils/testBucketAccess.js
   ```
   - The script will check if the bucket exists, test uploading a file, and verify you can get public URLs

4. **Troubleshooting**
   - If you encounter permission errors, check your bucket policies
   - Make sure the bucket is set as public
   - Verify that your Supabase credentials are correct in the lib/Superbase.ts file

## Using Course Resources

Resources are managed through the `resourceUtils.ts` utility functions:

- `uploadResource(courseId, moduleId)` - Upload a file and get a Resource object
- `getResourcePublicUrl(path)` - Get a public URL for a resource
- `getResourceSignedUrl(path, expiresIn)` - Get a signed URL with an expiration time
- `checkResourceExists(path)` - Check if a resource exists in storage

Resources you upload will be stored in the course-resources bucket and will be accessible to students who access your published courses.
