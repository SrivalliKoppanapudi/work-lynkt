/**
 * Test Script to verify course-resources bucket access
 * Run this script using 'node testBucketAccess.js' to verify bucket configuration
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase credentials - replace with your project's credentials
const SUPABASE_URL = 'https://dxhsmurbnfhkohqmmwuo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4aHNtdXJibmZoa29ocW1td3VvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA0MTA0NDYsImV4cCI6MjA1NTk4NjQ0Nn0.v_HnkWlnj64OVnzQMuxxPweM02soVZUr1qZNBSQrjuw';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test file data (very small PDF content in base64)
const testFileBase64 = 'JVBERi0xLjcKJeLjz9MKNSAwIG9iago8PC9GaWx0ZXIvRmxhdGVEZWNvZGUvTGVuZ3RoIDM4Pj5zdHJlYW0KeJwr5HIK4TI2U7AwMFMISeFyDeEK5CpUMFAw5OVyCuEENsYC1RgZ6hkaAgBZBAndCmV1ZHN0cmVhbQplbmRvYmoKNiAwIG9iago8PC9GaWx0ZXIvRmxhdGVEZWNvZGUvTGVuZ3RoIDg0ND4+c3RyZWFtCnicPZHbcpswEIZfRZfpxR6NVgKBuQicOMbYDm3duR2QMHUZg4Ax9N1rZJ80F8n+/9Kn3f3uGh9/PwzjuVjHdTvqAS/FOk6n3WHA0+tpHKJKFKNpLv7tPFZ9tC2++/F8KcbHzRDXdSQp1FHb5n82P3CJu6tA7a/oGPVrNOKw247RU1QfGofPdXu67KOBCzydRoyqSJBU3iM4bUc8/+qPGIprctmfxtsbPMx5cFfg+rzFdTPiWVNHki6/Jd8jQfJlI7/CdDzN14+Hw2mKGik1NXS9wubx9Hc3RpVWiXnUvXVdxkpRLaDWMpaJE1vG0qMsLxnLGGXaUqaR81+o09hB5jTGR2QoU7eUZYdyaSnLCK8tZamQpZayvIFMiYIrDqUHHCsORbQVRa4d7h6jFkrU2gM4aQ8o/aKgP6JeWqp5x1hoH/P+J1r7wKVDxf9oLMO+DrtUW/YSi7B8ZKE3FOSrUBqmLKbgDLZ3EBpK6AOWLwZldA/LZ6PcJVsVdFAyB6HxERZb+1CQN6GxKHDTVIxaMdFKQEERU1oBypQllgHKrEXFA8o8xjKgzFhUnKwWRoMMJTLCQo8xFmkRakp2VpASNnVooGpqTfWeNpIgkARzIAnm0ESCFDcTJLhhIkFaWOwLQhP7krLYWYGibXaWpmU2ljbyGnJLsL5GWDjsS3RK+9ogz+5SpLnMymD3QWV2Hwpmd6kVs/vUgR0FVbKjoFbMUKiSGQnVMkOhKmYoRZ1hhlLUc2YoRT1nRik60UYpOtFGKTpjD6VoUxul6LZZhXw7SRrk2yA1+LLJN1iFfIeVxXdYSQk7RzFJv2FFOuJj8mLiWe/MxaHPvq4HlU97hc8LPLTRdhjO9x3W+OXXm44n/H66XLbXlV/nH69vofpwvjxuu2lfbVv4jjffNpsRh9Cm3nT+A6eR21Q=';

// Convert base64 to Uint8Array for Supabase upload
function decode(base64) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function testBucketAccess() {
  console.log('Testing course-resources bucket access...');
  
  try {
    // Test 1: Check if bucket exists
    console.log('\n--- Test 1: Checking if course-resources bucket exists ---');
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();
    
    if (bucketsError) {
      throw new Error(`Failed to list buckets: ${bucketsError.message}`);
    }
    
    const courseResourcesBucket = buckets.find(bucket => bucket.name === 'course-resources');
    if (courseResourcesBucket) {
      console.log('✅ course-resources bucket exists!');
      console.log('Bucket details:', courseResourcesBucket);
    } else {
      console.log('❌ course-resources bucket NOT found!');
      console.log('Available buckets:', buckets.map(b => b.name).join(', '));
      throw new Error('course-resources bucket not found');
    }
    
    // Test 2: List files in the bucket
    console.log('\n--- Test 2: Listing files in course-resources bucket ---');
    const { data: files, error: filesError } = await supabase
      .storage
      .from('course-resources')
      .list();
    
    if (filesError) {
      throw new Error(`Failed to list files: ${filesError.message}`);
    }
    
    console.log('✅ Successfully listed files in course-resources bucket');
    console.log(`Found ${files.length} files at root level`);
    if (files.length > 0) {
      console.log('First 5 files:', files.slice(0, 5).map(f => f.name));
    }
    
    // Test 3: Upload a test file
    console.log('\n--- Test 3: Uploading test file to course-resources bucket ---');
    const testFilePath = `test/test-file-${Date.now()}.pdf`;
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('course-resources')
      .upload(testFilePath, decode(testFileBase64), {
        contentType: 'application/pdf',
        upsert: true,
      });
    
    if (uploadError) {
      throw new Error(`Failed to upload test file: ${uploadError.message}`);
    }
    
    console.log('✅ Successfully uploaded test file');
    console.log('Upload result:', uploadData);
    
    // Test 4: Get public URL for the uploaded file
    console.log('\n--- Test 4: Getting public URL for the uploaded file ---');
    const { data: urlData } = await supabase
      .storage
      .from('course-resources')
      .getPublicUrl(testFilePath);
    
    if (!urlData || !urlData.publicUrl) {
      throw new Error('Failed to get public URL for the uploaded file');
    }
    
    console.log('✅ Successfully got public URL');
    console.log('Public URL:', urlData.publicUrl);
    
    // Test 5: Create a signed URL
    console.log('\n--- Test 5: Creating signed URL for the uploaded file ---');
    const { data: signedData, error: signedError } = await supabase
      .storage
      .from('course-resources')
      .createSignedUrl(testFilePath, 60); // 60 seconds expiry
    
    if (signedError) {
      throw new Error(`Failed to create signed URL: ${signedError.message}`);
    }
    
    console.log('✅ Successfully created signed URL');
    console.log('Signed URL:', signedData.signedUrl);
    
    // Test 6: Clean up (delete the test file)
    console.log('\n--- Test 6: Cleaning up (deleting test file) ---');
    const { error: deleteError } = await supabase
      .storage
      .from('course-resources')
      .remove([testFilePath]);
    
    if (deleteError) {
      throw new Error(`Failed to delete test file: ${deleteError.message}`);
    }
    
    console.log('✅ Successfully deleted test file');
    
    // All tests passed
    console.log('\n✅ All tests passed! The course-resources bucket is properly configured and accessible.');
    console.log('You can now upload resources to this bucket and fetch them in your app.');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Please check your Supabase configuration and bucket setup.');
  }
}

// Run the tests
testBucketAccess(); 