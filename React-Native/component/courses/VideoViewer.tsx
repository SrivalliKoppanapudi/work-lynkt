import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  ActivityIndicator, 
  Dimensions, 
  Platform, 
  Alert,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { X, Play, Pause, Volume2, VolumeX, Maximize, Minimize, ExternalLink, RefreshCw } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system';
import Colors from '../../constant/Colors';

// Note: We'll use conditional screen orientation handling since the library might not be available
let ScreenOrientation: any = null;
try {
  ScreenOrientation = require('expo-screen-orientation');
} catch (e) {
  console.warn('expo-screen-orientation not available, fullscreen orientation changes will be disabled');
}

interface VideoViewerProps {
  url: string;
  title?: string;
  isVisible: boolean;
  onClose: () => void;
  onError?: (error: any) => void;
}

const VideoViewer: React.FC<VideoViewerProps> = ({ 
  url, 
  title,
  isVisible, 
  onClose,
  onError
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  
  // Initialize video player
  const player = useVideoPlayer(processedUrl || '', (player) => {
    player.loop = false;
    player.volume = 1.0;
    player.play();
  });

  // Get playing status
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });
  
  // Process and validate URL when visible or URL changes
  useEffect(() => {
    if (isVisible && url) {
      setLoading(true);
      setError(null);
      processVideoUrl(url);
    }
  }, [isVisible, url]);
  
  // Handle control visibility timeout
  useEffect(() => {
    if (showControls) {
      const timeout = setTimeout(() => {
        setShowControls(false);
      }, 3000);
      
      return () => clearTimeout(timeout);
    }
  }, [showControls]);
  
  // Process video URL based on type
  const processVideoUrl = async (sourceUrl: string) => {
    try {

      
      // Check if URL is empty
      if (!sourceUrl) {
        setError('No video URL provided');
        setLoading(false);
        handleCustomError('Missing video URL');
        return;
      }
      
      // Handle YouTube URLs
      if (sourceUrl.includes('youtube.com/watch') || sourceUrl.includes('youtu.be/')) {
        let videoId = '';
        if (sourceUrl.includes('youtube.com/watch')) {
          try {
            const urlObj = new URL(sourceUrl);
            videoId = urlObj.searchParams.get('v') || '';
          } catch (e) {
            console.error('Failed to parse YouTube URL:', e);
          }
        } else if (sourceUrl.includes('youtu.be/')) {
          videoId = sourceUrl.split('youtu.be/')[1]?.split('?')[0];
        }
        
        if (videoId) {
          // For YouTube videos, we'll need to handle them differently
          // We're setting the processed URL to a flag that will indicate to use WebView instead
          setProcessedUrl(`youtube:${videoId}`);
          setLoading(false);
          return;
        }
      }
      
      // Handle file:// URLs
      if (sourceUrl.startsWith('file://')) {
        // Check if file exists for local files
        try {
          if (FileSystem.documentDirectory) {
            const fileInfo = await FileSystem.getInfoAsync(sourceUrl);
            if (!fileInfo.exists) {
              setError(`File not found: ${sourceUrl}`);
              setLoading(false);
              handleCustomError('Local video file not found');
              return;
            }
          }
        } catch (err) {
          console.warn('Could not check file existence:', err);
          // Continue anyway since some platforms might not support FileSystem
        }
      }
      
      // Check file extension to ensure it's a video
      const fileExtension = sourceUrl.split('.').pop()?.toLowerCase();
      const videoExtensions = ['mp4', 'mov', 'avi', 'webm', 'mkv', 'm4v', '3gp', 'flv'];
      
      if (fileExtension && !videoExtensions.includes(fileExtension)) {
        console.warn(`Unusual file extension for video: ${fileExtension}`);
      }
      
      // Set the processed URL for the video player
      setProcessedUrl(sourceUrl);
      setLoading(false);
      
    } catch (err) {
      console.error('Error processing video URL:', err);
      setError('Failed to process video URL');
      setLoading(false);
      handleCustomError('Invalid video URL format');
    }
  };
  
  // Propagate errors to parent component if provided
  const handleCustomError = (errorMessage: string) => {
    if (onError) {
      onError({ message: errorMessage });
    }
  };
  
  const togglePlayPause = () => {
    setShowControls(true);
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  };

  const toggleMute = () => {
    setShowControls(true);
    player.volume = player.volume === 0 ? 1.0 : 0;
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    setShowControls(true);
  };

  const handleScreenTouch = () => {
    setShowControls(!showControls);
  };

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    processVideoUrl(url);
  };

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="fade"
      supportedOrientations={['portrait', 'landscape']}
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.modalContainer, isFullscreen && styles.fullscreenContainer]}>
        <StatusBar hidden={isFullscreen} />
        
        {/* Header with title and close button */}
        {!isFullscreen && (
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={1}>
              {title || 'Video Player'}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
            >
              <X size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
        
        {/* Main video container */}
        <View style={[styles.videoContainer, isFullscreen && styles.fullscreenContainer]}>
          {/* Loading indicator */}
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={Colors.PRIMARY} />
              <Text style={styles.loadingText}>Loading video...</Text>
            </View>
          )}
          
          {/* Error message */}
          {error && (
            <View style={styles.errorOverlay}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity 
                style={styles.errorButton}
                onPress={handleRetry}
              >
                <RefreshCw size={20} color="#fff" />
                <Text style={styles.errorButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {/* Video player */}
          {!error && processedUrl && (
            <TouchableOpacity
              activeOpacity={1}
              style={styles.videoWrapper}
              onPress={handleScreenTouch}
            >
              <VideoView
                style={styles.video}
                player={player}
                allowsFullscreen={true}
                allowsPictureInPicture={true}
              />
              
              {/* Video controls */}
              {showControls && !loading && (
                <View style={styles.controlsOverlay}>
                  {/* Top controls */}
                  <View style={styles.topControls}>
                    <TouchableOpacity 
                      style={styles.controlButton} 
                      onPress={toggleMute}
                    >
                      {player?.volume === 0 ? (
                        <VolumeX size={20} color="#ffffff" />
                      ) : (
                        <Volume2 size={20} color="#ffffff" />
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.controlButton} 
                      onPress={toggleFullscreen}
                    >
                      {isFullscreen ? (
                        <Minimize size={20} color="#ffffff" />
                      ) : (
                        <Maximize size={20} color="#ffffff" />
                      )}
                    </TouchableOpacity>
                  </View>
                  
                  {/* Center play/pause button */}
                  <TouchableOpacity 
                    style={styles.centerPlayButton} 
                    onPress={togglePlayPause}
                  >
                    {isPlaying ? (
                      <Pause size={40} color="#ffffff" />
                    ) : (
                      <Play size={40} color="#ffffff" />
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  fullscreenContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  videoWrapper: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  loadingText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 16,
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 20,
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  errorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.PRIMARY,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  errorButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 16,
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 16,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  controlButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  centerPlayButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
});

export default VideoViewer; 