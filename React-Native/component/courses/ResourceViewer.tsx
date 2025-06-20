import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  useWindowDimensions,
  SafeAreaView,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { X, AlertCircle, FileText, Play, ExternalLink, RefreshCw, Info } from 'lucide-react-native';
import Colors from '../../constant/Colors';
import { router } from 'expo-router';
import { supabase } from '../../lib/Superbase';
import { getResourcePublicUrl, getResourceSignedUrl, getAndroidPdfViewerUrl, optimizeVideoUrlForAndroid } from '../../utils/resourceUtils';

// Until VideoViewer is properly available, we'll use direct Video component
// import VideoViewer from './VideoViewer';

interface ResourceViewerProps {
  resourceUrl: string;
  resourceType: string;
  resourceTitle?: string;
  isVisible: boolean;
  onClose: () => void;
  courseId?: string;
  lessonId?: string;
  resourceId?: string;
}

export default function ResourceViewer({
  resourceUrl,
  resourceType,
  resourceTitle = 'Resource',
  isVisible,
  onClose,
  courseId,
  lessonId,
  resourceId,
}: ResourceViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const { width, height } = useWindowDimensions();
  const webViewRef = useRef<WebView>(null);
  
  // Process URL when resourceUrl or resourceType changes
  useEffect(() => {
    if (isVisible) {
      // console.log('ResourceViewer: Processing resource', { url: resourceUrl, type: resourceType, id: resourceId });
      setLoading(true);
      setError(null);
      validateUrl(resourceUrl);
    }
  }, [resourceUrl, resourceType, resourceId, isVisible]);
  
  // Function to validate and process the URL
  const validateUrl = async (url: string) => {
    // console.log('ResourceViewer: Validating URL', { url, type: resourceType, id: resourceId });
    setDebugInfo(`Validating URL: ${url} (${resourceType})`);
    
    if (!url) {
      console.error('ResourceViewer: Empty URL provided');
      setError('Resource URL is empty');
      setLoading(false);
      return;
    }
    
    let processedUrl = url;
    
    // Check if we have resourceId to fetch from storage
    if (resourceId) {
      // console.log('ResourceViewer: Resource ID detected, fetching from storage', resourceId);
      setDebugInfo(`Resource ID detected: ${resourceId} - Fetching from course-resources bucket...`);
      
      try {
        // First try to get public URL from the course-resources bucket
        const publicUrl = getResourcePublicUrl(resourceId);
        
        if (publicUrl) {
          // console.log('ResourceViewer: Retrieved public URL', publicUrl);
          setDebugInfo(`Retrieved public URL: ${publicUrl}`);
          processedUrl = publicUrl;
        } else {
          // console.log('ResourceViewer: Public URL not available, trying signed URL');
          // Fallback to signed URL if public URL doesn't work
          const signedUrl = await getResourceSignedUrl(resourceId, 3600); // 1 hour expiry
          
          if (signedUrl) {
            // console.log('ResourceViewer: Retrieved signed URL', signedUrl);
            setDebugInfo(`Retrieved signed URL: ${signedUrl}`);
            processedUrl = signedUrl;
          } else {
            console.error('ResourceViewer: Failed to get any URL for resource');
            setError('Resource file not found in storage');
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.error('ResourceViewer: Error fetching from storage:', err);
        setError('Error connecting to storage service');
        setLoading(false);
        return;
      }
    }
    // Check if the URL is a placeholder
    else if (url.includes('example.com') || !url.startsWith('http')) {
      console.warn('ResourceViewer: Invalid or placeholder URL detected', url);
      setDebugInfo(`Invalid URL detected: ${url} - Resource may not be available`);
      setError('This resource is not properly linked. Please contact support.');
      setLoading(false);
      return;
    }
    
    // Handle file:// URLs
    if (processedUrl.startsWith('file://')) {
      setDebugInfo(`File URL detected: ${processedUrl}`);
      
      // For iOS, we need special handling for file:// URLs
      if (Platform.OS === 'ios') {
        try {
          // Extract the actual path from the file URL
          // iOS file URLs can be complex with device-specific paths
          const iosPath = processedUrl.replace(/^file:\/\//, '');
          setDebugInfo(`Extracted iOS path: ${iosPath}`);
          
          // Properly encode the path for iOS WebView
          // Remove any double slashes and ensure proper encoding
          const normalizedPath = iosPath.replace(/\/\/+/g, '/');
          const encodedPath = encodeURI(normalizedPath);
          setDebugInfo(`Normalized and encoded iOS path: ${encodedPath}`);
          
          // For WebView, we'll keep the file:// protocol with proper encoding
          processedUrl = `file://${encodedPath}`;
          setDebugInfo(`Processed iOS file URL: ${processedUrl}`);
        } catch (err) {
          console.error('Error processing iOS file URL:', err);
          setError(`Cannot access this file. Error: ${err.message}`);
          setLoading(false);
          return;
        }
      }
    }
    
    // For PDFs on Android, use the Google Docs viewer
    // if (resourceType === 'pdf' && Platform.OS === 'android') {
    //   try {
    //     const pdfViewerUrl = getAndroidPdfViewerUrl(processedUrl);
    //     if (pdfViewerUrl) {
    //       setDebugInfo(`Using Android PDF viewer URL: ${pdfViewerUrl}`);
    //       processedUrl = pdfViewerUrl;
    //     }
    //   } catch (err) {
    //     console.error('Error getting Android PDF viewer URL:', err);
    //     // Continue with the original URL if there's an error
    //   }
    // }
    
    
    // For videos on Android, optimize the URL
    if (resourceType === 'video' && Platform.OS === 'android') {
      try {
        const optimizedUrl = optimizeVideoUrlForAndroid(processedUrl);
        if (optimizedUrl) {
          setDebugInfo(`Using optimized Android video URL: ${optimizedUrl}`);
          processedUrl = optimizedUrl;
        }
      } catch (err) {
        console.error('Error optimizing video URL for Android:', err);
        // Continue with the original URL if there's an error
      }
    }
    
    // Set the processed URL and continue loading
      setProcessedUrl(processedUrl);
    setDebugInfo(`Final URL: ${processedUrl}`);
      setLoading(false);
  };
  
  // Handle video resources - redirect to VideoScreen
  const handleVideoResource = () => {
    // Close the current viewer
    onClose();
    
    // Navigate to the VideoScreen with the video details
    router.push({
      pathname: "/(screens)/VideoScreen",
      params: { 
        videoUrl: processedUrl || resourceUrl,
        videoTitle: resourceTitle,
        courseId: courseId || '',
        lessonId: lessonId || '',
        resourceId: resourceId || ''
      }
    });
  };
  
  // Handle error retry
  const handleRetry = () => {
    setLoading(true);
    setError(null);
    validateUrl(resourceUrl);
  };
  
  // Show debug information
  const showDebugInfo = () => {
    Alert.alert(
      'Resource Debug Info',
      `Type: ${resourceType}\nTitle: ${resourceTitle}\nURL: ${resourceUrl}\nProcessed URL: ${processedUrl}\nDebug: ${debugInfo}`,
      [{ text: 'OK' }]
    );
  };
  
  // Render content based on resource type
  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.PRIMARY} />
          <Text style={styles.loadingText}>Loading {resourceType}...</Text>
        </View>
      );
    }
    
    if (error) {
      return (
        <View style={styles.errorContainer}>
          <AlertCircle size={40} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
          <View style={styles.errorActions}>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <RefreshCw size={16} color="#ffffff" />
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.debugButton} onPress={showDebugInfo}>
              <Info size={16} color="#ffffff" />
              <Text style={styles.debugButtonText}>Debug</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    
    if (resourceType === 'pdf') {
      // Special handling for PDF files
      // For Android, use Google Docs viewer for reliable in-app viewing
      const pdfViewUrl = Platform.OS === 'android' 
        ? getAndroidPdfViewerUrl(processedUrl || resourceUrl, true)
        : (processedUrl || resourceUrl);
        
      console.log(`PDF viewer using URL: ${pdfViewUrl} (${Platform.OS})`);
      
      return (
        <View style={styles.container}>
        <WebView
            ref={webViewRef}
            source={{ uri: pdfViewUrl }}
          style={styles.webView}
          renderLoading={() => (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={Colors.PRIMARY} />
                <Text style={styles.loadingText}>Loading PDF...</Text>
            </View>
          )}
          startInLoadingState={true}
            originWhitelist={['*']}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('WebView error:', nativeEvent);
              
              // Handle specific error cases
              if (nativeEvent.code === -1) {
                setError('Network error. Please check your internet connection.');
              } else if (nativeEvent.description?.includes('statusCode')) {
                setError('Unable to load the PDF. The file might be inaccessible.');
              } else {
                setError(`Failed to load PDF: ${nativeEvent.description || 'Unknown error'}`);
              }
              
              setDebugInfo(prev => `${prev}\nWebView error: ${JSON.stringify(nativeEvent)}`);
            }}
            onHttpError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('HTTP error:', nativeEvent);
              setError(`HTTP error ${nativeEvent.statusCode}: Unable to load the PDF`);
              setDebugInfo(prev => `${prev}\nHTTP error: ${JSON.stringify(nativeEvent)}`);
          }}
          onLoadEnd={() => {
              console.log('WebView load completed');
            setDebugInfo(prev => `${prev}\nWebView loading completed`);
          }}
            onLoadProgress={({ nativeEvent }) => {
              console.log(`Loading progress: ${nativeEvent.progress * 100}%`);
            }}
            androidLayerType="hardware"
            allowFileAccess={true}
            domStorageEnabled={true}
            javaScriptEnabled={true}
            allowUniversalAccessFromFileURLs={true}
            allowFileAccessFromFileURLs={true}
            mixedContentMode="always"
            overScrollMode="never"
            scalesPageToFit={true}
            // Prevent downloads
            onShouldStartLoadWithRequest={(request) => {
              // Allow only the initial PDF URL and Google Drive viewer URLs
              const isAllowedUrl = request.url.includes('drive.google.com/viewer') || 
                                 request.url === pdfViewUrl ||
                                 request.url === processedUrl ||
                                 request.url === resourceUrl;
              
              if (!isAllowedUrl) {
                console.log('Blocked navigation to:', request.url);
                return false;
              }
              return true;
            }}
            // Custom user agent to prevent downloads
            userAgent="Mozilla/5.0 (Linux; Android 11; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/91.0.4472.114 Mobile Safari/537.36"
          />
          
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => {
                  setError(null);
                  // Force WebView to reload
                  if (webViewRef.current) {
                    webViewRef.current.reload();
                  }
                }}
              >
                <RefreshCw size={20} color={Colors.PRIMARY} />
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      );
    }
    
    if (resourceType === 'video') {
      // For video resources, display a preview with a "Play" button that will open the VideoScreen
      return (
        <View style={styles.videoPreviewContainer}>
          <FileText size={60} color="#3b82f6" />
          <Text style={styles.videoPreviewTitle}>{resourceTitle}</Text>
          <TouchableOpacity
            style={styles.videoPlayButton}
            onPress={handleVideoResource}
          >
            <Play size={24} color="#ffffff" />
            <Text style={styles.videoPlayButtonText}>Play Video</Text>
          </TouchableOpacity>
          <Text style={styles.videoPreviewHint}>
            Tap Play to open the video player
          </Text>
        </View>
      );
    }
    
    if (resourceType === 'link') {
      return (
        <WebView
          source={{ uri: processedUrl || resourceUrl }}
          style={styles.webView}
          renderLoading={() => (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={Colors.PRIMARY} />
            </View>
          )}
          startInLoadingState={true}
          onError={(e) => setError(`Failed to load webpage: ${e.nativeEvent.description}`)}
        />
      );
    }
    
    return (
      <View style={styles.fallbackContainer}>
        <Text style={styles.fallbackText}>
          Unsupported resource type: {resourceType}
        </Text>
        <TouchableOpacity style={styles.debugButton} onPress={showDebugInfo}>
          <Info size={16} color="#ffffff" />
          <Text style={styles.debugButtonText}>Show Details</Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  return (
    
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >

      <View style={styles.container}>
      <SafeAreaView style={{flex: 1}}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
            {resourceTitle}
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color="#000000" />
          </TouchableOpacity>
        </View>
        <View style={styles.content}>{renderContent()}</View>
      </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 16,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 12,
    marginBottom: 20,
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
  },
  errorActions: {
    flexDirection: 'row',
    marginTop: 12,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.PRIMARY,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '500',
    marginLeft: 8,
  },
  debugButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6b7280',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  debugButtonText: {
    color: '#ffffff',
    fontWeight: '500',
    marginLeft: 8,
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fallbackText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  videoPreviewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f3f4f6',
  },
  videoPreviewTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
    color: '#1f2937',
  },
  videoPlayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  videoPlayButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  videoPreviewHint: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  retryText: {
    color: Colors.PRIMARY,
    fontWeight: '500',
    marginLeft: 8,
  },
});