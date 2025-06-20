import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Platform } from 'react-native';
import { supabase } from '../lib/Superbase';

// Resource type definition from your courses.ts
export interface Resource {
  id: string;
  type: 'pdf' | 'video' | 'presentation' | 'link';
  title: string;
  url: string;
  resource_id: string;
}

/**
 * Upload a resource file to Supabase storage
 * @param courseId The course ID for organizing files
 * @param moduleId The module ID for organizing files
 * @param selectedFile Optional file that was already selected
 * @returns A Resource object or null if upload fails
 */
export const uploadResource = async (
  courseId: string,
  moduleId: string,
  selectedFile?: any
): Promise<Resource | null> => {
  try {
    console.log('Starting resource upload process...');
    
    let asset;
    if (selectedFile) {
      // Use the provided file
      asset = selectedFile.assets[0];
      console.log('Using provided file:', asset.name, 'Size:', asset.size, 'Type:', asset.mimeType);
    } else {
      // Pick a document from the device
      if (Platform.OS === 'ios') {
        // For iOS, show an action sheet to choose between documents and photos
        return new Promise((resolve) => {
          Alert.alert(
            'Select File',
            'Choose a file source',
            [
              {
                text: 'Documents',
                onPress: async () => {
                  const result = await DocumentPicker.getDocumentAsync({
                    type: "*/*", // Allow any file type
                    copyToCacheDirectory: true,
                  });

                  if (result.canceled) {
                    console.log('User cancelled document picker');
                    resolve(null);
                    return;
                  }

                  const docAsset = result.assets[0];
                  console.log('Selected file:', docAsset.name, 'Size:', docAsset.size, 'Type:', docAsset.mimeType);
                  resolve(processUpload(courseId, moduleId, docAsset));
                }
              },
              {
                text: 'Videos',
                onPress: async () => {
                  // Use ImagePicker to access the device's video gallery
                  const result = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Videos,
                    allowsEditing: false,
                    quality: 1,
                  });

                  if (result.canceled) {
                    console.log('User cancelled photo picker');
                    resolve(null);
                    return;
                  }

                  const photoAsset = result.assets[0];
                  // Create a compatible asset object for processUpload
                  const compatibleAsset = {
                    uri: photoAsset.uri,
                    name: photoAsset.uri.split('/').pop() || `image_${Date.now()}.jpg`,
                    mimeType: 'image/jpeg',
                    size: photoAsset.fileSize || 0
                  };
                  console.log('Selected photo:', compatibleAsset.name);
                  resolve(processUpload(courseId, moduleId, compatibleAsset));
                }
              },
              {
                text: 'Cancel',
                style: 'cancel',
                onPress: () => {
                  console.log('User cancelled file selection');
                  resolve(null);
                }
              }
            ]
          );
        });
      } else {
        // For Android and other platforms, use document picker directly
        const result = await DocumentPicker.getDocumentAsync({
          type: "*/*", // Allow any file type
          copyToCacheDirectory: true,
        });

        if (result.canceled) {
          console.log('User cancelled document picker');
          return null;
        }

        asset = result.assets[0];
        console.log('Selected file:', asset.name, 'Size:', asset.size, 'Type:', asset.mimeType);
      }
    }
    // For non-iOS platforms or when a file is already selected, process the upload
    if (asset) {
      return processUpload(courseId, moduleId, asset);
    }
    
    return null;
    
  } catch (error) {
    console.error('Error uploading resource:', error);
    Alert.alert('Upload Error', `An error occurred while uploading the resource: ${error.message || 'Unknown error'}`);
    return null;
  }
};

/**
 * Convert base64 to binary data for Supabase upload
 */
// Helper function to process the upload after a file has been selected
const processUpload = async (
  courseId: string,
  moduleId: string,
  asset: any
): Promise<Resource | null> => {
  try {
    // Determine resource type
    let resourceType: 'pdf' | 'video' | 'link' = 'link';
    
    // Check file extension first
    const fileExtension = asset.name.split('.').pop()?.toLowerCase();
    const videoExtensions = ['mp4', 'mov', 'avi', 'webm', 'mkv'];
    const pdfExtensions = ['pdf'];
    
    if (fileExtension && videoExtensions.includes(fileExtension)) {
      resourceType = 'video';
    } else if (fileExtension && pdfExtensions.includes(fileExtension)) {
      resourceType = 'pdf';
    } else if (asset.mimeType) {
      // Fallback to MIME type if extension check doesn't work
      if (asset.mimeType.includes('pdf')) {
        resourceType = 'pdf';
      } else if (asset.mimeType.includes('video')) {
        resourceType = 'video';
      }
    }
    
    console.log('Determined resource type:', resourceType);
    
    // Generate a unique storage path - include user ID if available
    const userId = (await supabase.auth.getUser()).data.user?.id || 'anonymous';
    const uniqueFileName = `${userId}/${courseId}/${moduleId}/${Date.now()}_${asset.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    
    console.log('Generated storage path:', uniqueFileName);
    
    // Read file as base64
    console.log('Reading file as base64...');
    const base64 = await FileSystem.readAsStringAsync(asset.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // Convert base64 to binary data for upload
    console.log('Converting base64 to binary data...');
    const binaryData = decode(base64);
    
    // Upload to Supabase course-resources bucket
    console.log('Uploading to course-resources bucket...');
    const { data, error } = await supabase.storage
      .from('course-resources')
      .upload(uniqueFileName, binaryData, {
        contentType: asset.mimeType || `application/${fileExtension}`,
        upsert: true,
      });
    
    if (error) {
      console.error('Upload error:', error);
      Alert.alert('Upload Failed', `Could not upload file to storage: ${error.message}`);
      return null;
    }
    
    console.log('Successfully uploaded to Supabase:', data?.path);
    
    // Get the public URL for the resource from the public bucket
    console.log('Getting public URL from course-resources bucket...');
    const { data: urlData } = supabase.storage
      .from('course-resources')
      .getPublicUrl(uniqueFileName);
    
    if (!urlData || !urlData.publicUrl) {
      console.error('Failed to get public URL');
      Alert.alert('Error', 'Uploaded file but failed to get public URL');
      return null;
    }
    
    console.log('Retrieved public URL:', urlData.publicUrl);
    
    // Verify URL is accessible
    try {
      console.log('Verifying resource URL is accessible...');
      const exists = await checkResourceExists(uniqueFileName);
      if (!exists) {
        console.warn('Resource existence check failed - URL may not be accessible');
      } else {
        console.log('Resource URL verified as accessible');
      }
    } catch (verifyError) {
      console.warn('Error verifying resource accessibility:', verifyError);
    }
    
    // Create a resource object with a temporary ID
    const tempResource: Resource = {
      id: `temp-${Date.now()}`,
      title: asset.name,
      type: resourceType,
      url: urlData.publicUrl,
      resource_id: uniqueFileName,
    };
    
    // Check if courseId is a valid UUID
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(courseId);
    
    if (!isValidUUID) {
      console.warn('Course ID is not a valid UUID, skipping database save');
      return tempResource;
    }
    
    // Save the resource to the course_resources table
    console.log('Saving resource to course_resources table...');
    const { data: dbData, error: dbError } = await supabase
      .from('course_resources')
      .insert({
        course_id: courseId,
        module_id: moduleId,
        title: asset.name,
        type: resourceType,
        url: urlData.publicUrl,
        resource_id: uniqueFileName
      })
      .select();
      
    // Also update the resources array in the course table
    if (!dbError && isValidUUID) {
      try {
        console.log('Updating resources in course table...');
        
        // First get the current course data
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('modules, resources')
          .eq('id', courseId)
          .single();
          
        if (courseError) {
          console.error('Error fetching course data:', courseError);
        } else if (courseData) {
          // Prepare the new resource to add to course resources array
          const newCourseResource = {
            id: dbData?.[0]?.id || `temp-${Date.now()}`,
            title: asset.name,
            type: resourceType,
            url: urlData.publicUrl,
            resource_id: uniqueFileName
          };
          
          // Get current resources array or initialize empty array
          let currentResources = [];
          if (courseData.resources) {
            // Handle both array and JSON string formats
            if (typeof courseData.resources === 'string') {
              try {
                currentResources = JSON.parse(courseData.resources);
              } catch (e) {
                console.error('Error parsing resources JSON:', e);
                currentResources = [];
              }
            } else if (Array.isArray(courseData.resources)) {
              currentResources = courseData.resources;
            }
          }
          
          // Add the new resource
          currentResources.push(newCourseResource);
          
          // Update the course with the new resources array
          const { error: updateError } = await supabase
            .from('courses')
            .update({ resources: currentResources })
            .eq('id', courseId);
            
          if (updateError) {
            console.error('Error updating course resources:', updateError);
          } else {
            console.log('Successfully updated resources in course table');
          }
        }
      } catch (courseUpdateError) {
        console.error('Error updating course resources:', courseUpdateError);
      }
    }
      
    if (dbError) {
      console.error('Database error:', dbError);
      Alert.alert('Error', 'Failed to save resource to database');
      return tempResource;
    }
    
    console.log('Resource saved to database:', dbData);
    
    // Create a new resource with the correct properties
    const newResource: Resource = {
      id: dbData[0].id,
      title: asset.name,
      type: resourceType,
      url: urlData.publicUrl,
      resource_id: uniqueFileName,
    };
    
    console.log('Created resource object:', newResource);
    return newResource;
  } catch (error) {
    console.error('Error processing upload:', error);
    Alert.alert('Upload Error', `An error occurred while processing the upload: ${error.message || 'Unknown error'}`);
    return null;
  }
};

export const decode = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

/**
 * Get a public URL for a resource in Supabase storage
 */
export const getResourcePublicUrl = (path: string): string => {
  if (!path) {
    return '';
  }
  
  const { data } = supabase.storage
    .from('course-resources')
    .getPublicUrl(path);
    
  if (!data || !data.publicUrl) {
    return '';
  }
  
  return data.publicUrl;
};

/**
 * Get a signed URL with expiration time for a resource
 * Useful for resources that require authenticated access
 */
export const getResourceSignedUrl = async (
  path: string, 
  expiresIn: number = 3600
): Promise<string> => {
  const { data, error } = await supabase.storage
    .from('course-resources')
    .createSignedUrl(path, expiresIn);
    
  if (error || !data) {
    return '';
  }
  
  return data.signedUrl;
};

/**
 * Check if a resource exists in Supabase storage
 */
export const checkResourceExists = async (path: string): Promise<boolean> => {
  try {
    // First try getting a public URL
    const publicUrl = getResourcePublicUrl(path);
    if (!publicUrl) {
      return false;
    }
    
    // Try to access the public URL with a HEAD request
    if (Platform.OS === 'web') {
      const response = await fetch(publicUrl, { method: 'HEAD' });
      const exists = response.ok;
      return exists;
    } else {
      // On native platforms, try with signed URL as fallback
      const { data } = await supabase.storage
        .from('course-resources')
        .createSignedUrl(path, 10); // Short expiry just to check existence
        
      const exists = !!data;
      return exists;
    }
  } catch (error) {
    return false;
  }
};

export const getAndroidPdfViewerUrl = (pdfUrl: string, useGoogleViewer: boolean = true): string => {
  if (!pdfUrl) {
    return '';
  }
  
  // Clean up the URL first
  let cleanUrl = pdfUrl.trim();
  
  // If already encoded, decode it first to prevent double encoding
  try {
    if (cleanUrl.includes('%')) {
      cleanUrl = decodeURIComponent(cleanUrl);
    }
  } catch (e) {
    // Use original URL if decoding fails
  }

  if (useGoogleViewer) {
    // Use a more reliable PDF viewer URL format
    const encodedPdfUrl = encodeURIComponent(cleanUrl);
    // Using drive.google.com/viewer for better compatibility
    const finalUrl = `https://drive.google.com/viewerng/viewer?embedded=true&url=${encodedPdfUrl}`;
    
    return finalUrl;
  }
  
  return cleanUrl;
};

/**
 * Optimize video URL for Android playback
 * This function handles special cases for Android video playback
 */
export const optimizeVideoUrlForAndroid = (url: string): string => {
  if (!url) {
    console.error('No video URL provided to optimizeVideoUrlForAndroid');
    return '';
  }

  console.log('Original video URL:', url);
  
  // Clean up the URL first
  let cleanUrl = url.trim();
  
  // If already encoded, decode it first to prevent double encoding
  try {
    if (cleanUrl.includes('%')) {
      cleanUrl = decodeURIComponent(cleanUrl);
    }
  } catch (e) {
    console.warn('URL decoding failed, using original URL:', e);
  }

  // For YouTube videos, use a mobile-friendly format
  if (cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be')) {
    try {
      // Extract YouTube video ID
      let videoId = '';
      if (cleanUrl.includes('youtube.com/watch')) {
        const urlObj = new URL(cleanUrl);
        videoId = urlObj.searchParams.get('v') || '';
      } else if (cleanUrl.includes('youtu.be/')) {
        videoId = cleanUrl.split('youtu.be/')[1]?.split('?')[0];
      }
      
      if (videoId) {
        // Use YouTube mobile embed URL
        const optimizedUrl = `https://www.youtube.com/embed/${videoId}`;
        console.log('Optimized YouTube URL:', optimizedUrl);
        return optimizedUrl;
      }
    } catch (err) {
      console.error('Error optimizing YouTube URL:', err);
    }
  }
  
  // For Vimeo videos, use a mobile-friendly format
  if (cleanUrl.includes('vimeo.com')) {
    try {
      // Extract Vimeo video ID
      const videoId = cleanUrl.split('vimeo.com/')[1]?.split('?')[0];
      
      if (videoId) {
        // Use Vimeo mobile embed URL
        const optimizedUrl = `https://player.vimeo.com/video/${videoId}`;
        console.log('Optimized Vimeo URL:', optimizedUrl);
        return optimizedUrl;
      }
    } catch (err) {
      console.error('Error optimizing Vimeo URL:', err);
    }
  }
  
  // For direct video files, ensure proper encoding
  return encodeURI(cleanUrl);
};