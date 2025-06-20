import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  Dimensions,
  StatusBar,
  Alert,
  ScrollView,
  FlatList,
  BackHandler,
  Image
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEvent } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { ArrowLeft, Play, Pause, Volume2, VolumeX, Maximize, Minimize, X } from 'lucide-react-native';
import Colors from '../../constant/Colors';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../../lib/Superbase';
import { getResourcePublicUrl, getResourceSignedUrl } from '../../utils/resourceUtils';
import * as ScreenOrientation from 'expo-screen-orientation';

// Type guard for status
interface VideoStatus {
  didJustFinish: boolean;
  durationMillis?: number;
  positionMillis?: number;
}

function isValidVideoStatus(status: any): status is VideoStatus {
  return status != null && typeof status === 'object' && typeof status.didJustFinish === 'boolean';
}

// Utility to validate image source
const getValidImageSource = (uri: any) => {
  if (typeof uri === 'string' && uri.length > 0) {
    return { uri };
  }
  return require('../../assets/images/video-thumbnail.png');
};

export default function VideoScreen() {
  const router = useRouter();
  const { videoUrl, videoTitle, courseId, lessonId, resourceId } = useLocalSearchParams();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [videoResources, setVideoResources] = useState<any[]>([]);
  const [currentResourceIndex, setCurrentResourceIndex] = useState(0);
  const [moduleData, setModuleData] = useState<any[]>([]);
  const [flattenedVideoResources, setFlattenedVideoResources] = useState<any[]>([]);
  const [courseTitle, setCourseTitle] = useState('');
  const [courseImage, setCourseImage] = useState<string | null>(null);
  const [isFetchingDurations, setIsFetchingDurations] = useState(false);
  const [durationFetchQueue, setDurationFetchQueue] = useState<any[]>([]);
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);
  const [lastPosition, setLastPosition] = useState(0);
  const [videoEnded, setVideoEnded] = useState(false);
  const [actualDuration, setActualDuration] = useState<number | null>(null);
  const [videoPosition, setVideoPosition] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  
  // Initialize video player with a check for valid URL
  const player = useVideoPlayer(processedUrl || '');

  // Get playing status with null check
  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player?.playing || false });
  
  // Listen for status changes with null check
  const { status } = useEvent(player, 'statusChange', { status: player?.status || 'idle' });

  // Handle video status updates
  useEffect(() => {
    if (player && player.duration && player.duration > 0 && (!actualDuration || actualDuration <= 0)) {
      const durationSeconds = Math.floor(player.duration);
      setActualDuration(durationSeconds);
      
      const formattedDuration = (() => {
        const minutes = Math.floor(durationSeconds / 60);
        const seconds = durationSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      })();
      
      if (resourceId && flattenedVideoResources.length > 0) {
        const resourceIndex = flattenedVideoResources.findIndex(r => 
          r.id === resourceId || r.resource_id === resourceId
        );
        
        if (resourceIndex !== -1) {
          const currentResource = flattenedVideoResources[resourceIndex];
          if (!currentResource.actualDuration || currentResource.actualDuration !== durationSeconds) {
            const updatedResources = [...flattenedVideoResources];
            updatedResources[resourceIndex] = {
              ...updatedResources[resourceIndex],
              duration: formattedDuration,
              actualDuration: durationSeconds
            };
            setFlattenedVideoResources(updatedResources);
            updateModuleDataWithDuration(resourceId, formattedDuration, durationSeconds);
            setCurrentResourceIndex(resourceIndex);
          }
        }
      }
    }
    
    if (isValidVideoStatus(status) && status.didJustFinish && autoPlayEnabled && !videoEnded) {
      setVideoEnded(true);
      setTimeout(() => {
        playNextVideo();
      }, 500);
    }
  }, [status, player, resourceId, actualDuration, autoPlayEnabled, videoEnded]);

  // Playback status listener for auto-play
  useEffect(() => {
    if (!player || !('addListener' in player)) return;
    
    let listener: any = null;
    try {
      listener = (player as any).addListener('playbackStatusUpdate', (status: any) => {
        if (isValidVideoStatus(status) && status.didJustFinish && autoPlayEnabled && !videoEnded) {
          setVideoEnded(true);
          setTimeout(() => {
            playNextVideo();
          }, 500);
        }
      });
    } catch (err) {}
    
    return () => {
      if (listener) {
        try {
          listener.remove();
        } catch (err) {}
      }
    };
  }, [player, autoPlayEnabled, videoEnded]);

  // Video position tracking
  useEffect(() => {
    const interval = setInterval(() => {
      if (player && 'getStatusAsync' in player) {
        (player as any).getStatusAsync().then((status: any) => {
          if (isValidVideoStatus(status)) {
            if (typeof status.durationMillis === 'number' && status.durationMillis > 0) {
              setVideoDuration(status.durationMillis / 1000);
            }
            if (typeof status.positionMillis === 'number') {
              const position = status.positionMillis / 1000;
              setVideoPosition(position);
              
              const duration = typeof status.durationMillis === 'number' 
                ? status.durationMillis / 1000 
                : videoDuration;
              
              if (duration > 0 && position > 0 && 
                  (position >= duration * 0.95 || duration - position < 2) && 
                  autoPlayEnabled && !videoEnded) {
                setVideoEnded(true);
                setTimeout(() => {
                  playNextVideo();
                }, 500);
              }
              
              if (status.didJustFinish && autoPlayEnabled && !videoEnded) {
                setVideoEnded(true);
                setTimeout(() => {
                  playNextVideo();
                }, 500);
              }
            }
          }
        }).catch(() => {});
      }
    }, 250);
    
    return () => clearInterval(interval);
  }, [player, autoPlayEnabled, videoEnded, videoDuration]);

  // Auto-play detection
  useEffect(() => {
    if (!autoPlayEnabled) return;
    
    const isNearEnd = videoDuration > 0 && videoPosition > 0 && 
                     (videoDuration - videoPosition < 2 || videoPosition >= videoDuration * 0.95);
    const hasStoppedPlaying = isPlaying && videoPosition > 0 && lastPosition > 0 && 
                            Math.abs(videoPosition - lastPosition) < 0.2 && 
                            videoPosition > videoDuration * 0.9;
    
    setLastPosition(videoPosition);
    
    if ((isNearEnd || hasStoppedPlaying) && !videoEnded) {
      setVideoEnded(true);
      const timer = setTimeout(() => {
        playNextVideo();
      }, 500);
      return () => clearTimeout(timer);
    }
    
    if (!isNearEnd && videoEnded && videoPosition < videoDuration * 0.9) {
      setVideoEnded(false);
    }
  }, [videoPosition, videoDuration, isPlaying, lastPosition, videoEnded, autoPlayEnabled]);

  // Play next video
  const playNextVideo = () => {
    if (!flattenedVideoResources || flattenedVideoResources.length === 0 || !player) return;
    
    const nextIndex = (currentResourceIndex + 1) % flattenedVideoResources.length;
    const nextResource = flattenedVideoResources[nextIndex];
    if (!nextResource) return;
    
    setCurrentResourceIndex(nextIndex);
    setVideoEnded(false);
    handleVideoSelect(nextResource);
  };

  // Handle video errors
  useEffect(() => {
    if (error && player && 'pause' in player) {
      player.pause();
      setError(error);
    } else {
      setError(null);
    }
  }, [error, player]);

  // Auto-play on URL change
  useEffect(() => {
    if (processedUrl) {
      setVideoEnded(false);
      const setPropertiesTimer = setTimeout(() => {
        if (player && 'loop' in player && 'volume' in player) {
          player.loop = false;
          player.volume = 1.0;
        }
      }, 500);
      
      let attemptCount = 0;
      const maxAttempts = 3;
      let autoPlayTimer: NodeJS.Timeout | null = null;
      
      const attemptPlay = () => {
        if (!processedUrl) return;
        attemptCount++;
        try {
          if (player && 'play' in player) {
            player.play();
          } else if (attemptCount < maxAttempts) {
            autoPlayTimer = setTimeout(attemptPlay, 1500);
          }
        } catch {
          if (attemptCount < maxAttempts) {
            autoPlayTimer = setTimeout(attemptPlay, 1500);
          }
        }
      };
      
      autoPlayTimer = setTimeout(attemptPlay, 1500);
      
      return () => {
        clearTimeout(setPropertiesTimer);
        if (autoPlayTimer) clearTimeout(autoPlayTimer);
      };
    }
  }, [processedUrl]);

  // Initial auto-play
  useEffect(() => {
    if (processedUrl && player) {
      const initialPlayTimer = setTimeout(() => {
        if (player && 'play' in player && processedUrl) {
          player.play();
        }
      }, 2500);
      return () => clearTimeout(initialPlayTimer);
    }
  }, []);

  // Duration fetch queue processing
  useEffect(() => {
    if (!isFetchingDurations || durationFetchQueue.length === 0) return;
    
    const currentUrl = processedUrl;
    const currentResourceId = resourceId;
    const resource = durationFetchQueue[0];
    
    const getResourceUrl = async () => {
      let resourceUrl = resource.url;
      if (resource.resource_id) {
        const resourcePath = resource.resource_id;
        if (resourcePath.startsWith('http')) {
          resourceUrl = resourcePath;
        } else {
          resourceUrl = getResourcePublicUrl(resourcePath);
          if (!resourceUrl) {
            try {
              resourceUrl = await getResourceSignedUrl(resourcePath, 3600);
            } catch {
              return null;
            }
          }
        }
      }
      return resourceUrl;
    };
    
    const processResource = async () => {
      const resourceUrl = await getResourceUrl();
      if (!resourceUrl) {
        setDurationFetchQueue(prev => prev.slice(1));
        return;
      }
      setProcessedUrl(resourceUrl);
    };
    
    processResource();
    
    const timeoutId = setTimeout(() => {
      setDurationFetchQueue(prev => prev.slice(1));
      if (durationFetchQueue.length <= 1) {
        if (currentUrl) setProcessedUrl(currentUrl);
        setIsFetchingDurations(false);
      }
    }, 5000);
    
    return () => clearTimeout(timeoutId);
  }, [isFetchingDurations, durationFetchQueue, processedUrl, resourceId]);

  // Handle duration detection
  useEffect(() => {
    if (!isFetchingDurations || durationFetchQueue.length === 0 || !player) return;
    
    if (player && player.duration && player.duration > 0) {
      const resource = durationFetchQueue[0];
      const durationSeconds = Math.floor(player.duration);
      const formattedDuration = `${Math.floor(durationSeconds / 60).toString().padStart(2, '0')}:${(durationSeconds % 60).toString().padStart(2, '0')}`;
      
      const updatedResources = [...flattenedVideoResources];
      const resourceIndex = updatedResources.findIndex(r => 
        r.id === resource.id || r.resource_id === resource.resource_id
      );
      
      if (resourceIndex !== -1) {
        updatedResources[resourceIndex] = {
          ...updatedResources[resourceIndex],
          duration: formattedDuration,
          actualDuration: durationSeconds
        };
        setFlattenedVideoResources(updatedResources);
        if (resource.id) {
          updateModuleDataWithDuration(resource.id, formattedDuration, durationSeconds);
        }
      }
      
      setDurationFetchQueue(prev => prev.slice(1));
      if (durationFetchQueue.length <= 1) {
        if (videoUrl) setProcessedUrl(videoUrl as string);
        setIsFetchingDurations(false);
      }
    }
  }, [isFetchingDurations, durationFetchQueue, player.duration]);

  // Reset player state
  useEffect(() => {
    if (player) {
      player.pause();
      if ('seek' in player) {
        (player as any).seek(0);
      }
      setError(null);
      setActualDuration(null);
      
      if (resourceId && flattenedVideoResources.length > 0) {
        const resourceIndex = flattenedVideoResources.findIndex(r => 
          r.id === resourceId || r.resource_id === resourceId
        );
        if (resourceIndex !== -1) {
          const currentResource = flattenedVideoResources[resourceIndex];
          if (!currentResource.actualDuration) {
            const updatedResources = [...flattenedVideoResources];
            updatedResources[resourceIndex] = {
              ...updatedResources[resourceIndex],
              duration: '00:00'
            };
            setFlattenedVideoResources(updatedResources);
          }
        }
      }
    }
  }, [resourceId, player]);

  // Fetch course resources
  useEffect(() => {
    if (courseId) {
      fetchCourseResources();
    }
  }, [courseId, resourceId]);

  const fetchCourseResources = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (error) {
        console.error('Error fetching course:', error);
        return;
      }
      
      if (data) {
        if (data.title) setCourseTitle(data.title);
        if (data.image) {
          // console.log('Course image:', data.image, typeof data.image); // Debug
          setCourseImage(data.image);
        }
      }
      
      if (data && data.modules) {
        let allResources: any[] = [];
        let modules;
        
        if (typeof data.modules === 'string') {
          try {
            modules = JSON.parse(data.modules);
          } catch (e) {
            console.error('Error parsing modules JSON:', e);
            modules = [];
          }
        } else {
          modules = data.modules;
        }
        
        const processedModules = modules.map((module: any) => {
          const videoResources = module.resources && Array.isArray(module.resources) 
            ? module.resources.filter((resource: any) => {
                const resourceType = resource.type || determineResourceType(resource.url);
                return resourceType === 'video';
              })
            : [];
            
          const processedResources = videoResources.map((resource: any, index: number) => {
            const hasActualDuration = resource.actualDuration && resource.actualDuration > 0;
            return {
              ...resource,
              moduleId: module.id,
              moduleName: module.name || module.title || 'Unnamed Module',
              videoNumber: index + 1,
              duration: hasActualDuration 
                ? formatDuration(String(resource.actualDuration)) 
                : resource.duration || '00:00',
              thumbnail: typeof resource.thumbnail === 'string' ? resource.thumbnail : null
            };
          });

          return {
            ...module,
            videoResources: processedResources,
          };
        }).filter((module: any) => module.videoResources && module.videoResources.length > 0);
        
        setModuleData(processedModules);
        
        modules.forEach((module: any) => {
          if (module.resources && Array.isArray(module.resources)) {
            allResources = [...allResources, ...module.resources];
          }
        });
        
        setResources(allResources);
        
        const videos: any[] = [];
        allResources.forEach((resource: any) => {
          const resourceType = resource.type || determineResourceType(resource.url);
          if (resourceType === 'video') {
            videos.push(resource);
          }
        });
        
        const flattenedVideos: any[] = [];
        if (Array.isArray(modules)) {
          modules.forEach((module: any) => {
            if (module.resources && Array.isArray(module.resources)) {
              const moduleVideos = module.resources.filter((resource: any) => {
                const resourceType = resource.type || determineResourceType(resource.url);
                return resourceType === 'video';
              }).map((resource: any, index: number) => {
                // console.log('Flattened thumbnail:', resource.thumbnail, typeof resource.thumbnail); // Debug
                const hasActualDuration = resource.actualDuration && resource.actualDuration > 0;
                return {
                  ...resource,
                  moduleId: module.id,
                  moduleName: module.name || module.title || 'Unnamed Module',
                  videoNumber: index + 1,
                  duration: hasActualDuration 
                    ? formatDuration(String(resource.actualDuration)) 
                    : resource.duration || '00:00',
                  thumbnail: typeof resource.thumbnail === 'string' ? resource.thumbnail : null
                };
              });
              flattenedVideos.push(...moduleVideos);
            }
          });
        }
        setFlattenedVideoResources(flattenedVideos);
        setVideoResources(videos);
        
        if (resourceId) {
          const index = flattenedVideos.findIndex((r: any) => r.id === resourceId || r.resource_id === resourceId);
          if (index !== -1) {
            setCurrentResourceIndex(index);
          }
        }
        
        fetchAllVideoDurations(flattenedVideos);
      }
    } catch (err) {
      console.error('Error fetching resources:', err);
    }
  };
  
  const updateModuleDataWithDuration = (resourceId: string | string[] | undefined, formattedDuration: string, durationSeconds: number) => {
    if (!resourceId || !moduleData.length) return;
    
    const resourceIdStr = typeof resourceId === 'string' ? resourceId : 
                         Array.isArray(resourceId) ? resourceId[0] : '';
    
    const updatedModuleData = [...moduleData];
    let updated = false;
    
    for (let i = 0; i < updatedModuleData.length; i++) {
      const module = updatedModuleData[i];
      if (!module.videoResources || !Array.isArray(module.videoResources)) continue;
      
      for (let j = 0; j < module.videoResources.length; j++) {
        const resource = module.videoResources[j];
        if (resource.id === resourceIdStr || resource.resource_id === resourceIdStr) {
          updatedModuleData[i].videoResources[j] = {
            ...resource,
            duration: formattedDuration,
            actualDuration: durationSeconds
          };
          updated = true;
          break;
        }
      }
      if (updated) break;
    }
    
    if (updated) {
      setModuleData(updatedModuleData);
    }
  };

  const formatDuration = (duration: string | undefined) => {
    if (!duration) return '00:00';
    if (/^\d{2}:\d{2}$/.test(duration)) return duration;
    try {
      const durationNum = parseInt(duration);
      if (!isNaN(durationNum) && durationNum > 0) {
        const minutes = Math.floor(durationNum / 60);
        const seconds = durationNum % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
    } catch (e) {
      console.log('Error parsing duration:', duration); 
    }
    return '00:00';
  };
  
  const fetchAllVideoDurations = (videoResources: any[]) => {
    if (!videoResources || videoResources.length === 0 || isFetchingDurations) return;
    
    const resourceQueue = videoResources
      .filter(resource => !resource.actualDuration || resource.actualDuration <= 0)
      .filter(resource => resource.url && !resource.url.includes('youtube.com') && !resource.url.includes('youtu.be'));
    
    if (resourceQueue.length === 0) return;
    
    setDurationFetchQueue(resourceQueue);
    setIsFetchingDurations(true);
  };
  
  const determineResourceType = (url: string): string => {
    if (!url) return 'video';
    const lowerUrl = url.toLowerCase();
    
    if (
      lowerUrl.endsWith('.mp4') ||
      lowerUrl.endsWith('.mov') ||
      lowerUrl.endsWith('.avi') ||
      lowerUrl.endsWith('.webm') ||
      lowerUrl.includes('youtube.com') ||
      lowerUrl.includes('youtu.be') ||
      lowerUrl.includes('vimeo.com')
    ) {
      return 'video';
    }
    
    if (lowerUrl.endsWith('.pdf')) {
      return 'pdf';
    }
    
    if (lowerUrl.startsWith('http')) {
      return 'link';
    }
    
    return 'video';
  };

  useEffect(() => {
    const handleOrientationChange = async () => {
      try {
        if (isFullscreen) {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        } else {
          await ScreenOrientation.unlockAsync();
          if (Platform.OS === 'ios') {
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
          } else {
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
          }
        }
      } catch (error) {
        console.log('Orientation change not supported on this device');
      }
    };

    handleOrientationChange();

    return () => {
      (async () => {
        try {
          await ScreenOrientation.unlockAsync();
        } catch (error) {
          console.log('Error unlocking orientation');
        }
      })();
    };
  }, [isFullscreen]);
  
  useEffect(() => {
    if (showControls) {
      const timeout = setTimeout(() => {
        setShowControls(false);
      }, 800);
      return () => clearTimeout(timeout);
    }
  }, [showControls]);
  
  useEffect(() => {
    if (!videoUrl) {
      setError('No video URL provided');
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    
    if (player) {
      player.pause();
      if ('seek' in player) {
        (player as any).seek(0);
      }
    }
    
    processVideoUrl(videoUrl as string);
  }, [videoUrl, resourceId, player]);
  
  const processVideoUrl = async (url: string) => {
    try {
      if (resourceId || url.includes('example.com')) {
        if (resourceId) {
          const foundResource = resources.find(r => r.id === resourceId || r.resource_id === resourceId);
          const resourcePath = foundResource?.resource_id || 
                               (typeof resourceId === 'string' ? resourceId : 
                               Array.isArray(resourceId) ? resourceId[0] : '');
          
          if (!resourcePath) {
            setError('Invalid resource ID format');
            setIsLoading(false);
            return;
          }
          
          let publicUrl = '';
          if (resourcePath.startsWith('http')) {
            publicUrl = resourcePath;
          } else {
            publicUrl = getResourcePublicUrl(resourcePath);
          }
          
          if (publicUrl) {
            url = publicUrl;
          } else {
            const signedUrl = await getResourceSignedUrl(resourcePath, 3600);
            if (signedUrl) {
              url = signedUrl;
            } else {
              setError('Video file not found in storage');
              setIsLoading(false);
              return;
            }
          }
        } else {
          setError('Missing resource ID for storage access');
          setIsLoading(false);
          return;
        }
      }
      
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        handleYouTubeVideo(url);
        return;
      }
      
      setProcessedUrl(url);
      setIsLoading(false);
    } catch (err) {
      console.error('Error processing video URL:', err);
      setError('Failed to process video URL');
      setIsLoading(false);
    }
  };
  
  const handleYouTubeVideo = (url: string) => {
    WebBrowser.openBrowserAsync(url)
      .then(() => {
        router.back();
      })
      .catch(err => {
        console.error('Failed to open YouTube video:', err);
        setError('Failed to open YouTube video');
      });
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
    setIsLoading(true);
    processVideoUrl(videoUrl as string);
  };

  const handleVideoSelect = (resource: any) => {
    if (player) {
      player.pause();
      if ('seek' in player) {
        (player as any).seek(0);
      }
    }
    
    setProcessedUrl(null);
    setIsLoading(true);
    setError(null);
    setActualDuration(null);
    setVideoPosition(0);
    setVideoDuration(0);
    setLastPosition(0);
    setVideoEnded(false);
    
    const index = flattenedVideoResources.findIndex(r => 
      r.id === resource.id || r.resource_id === resource.resource_id
    );
    if (index !== -1) {
      setCurrentResourceIndex(index);
      const updatedResources = [...flattenedVideoResources];
      updatedResources[index] = {
        ...updatedResources[index],
        duration: '00:00'
      };
      setFlattenedVideoResources(updatedResources);
    }
    
    processVideoUrl(resource.url);
    
    router.setParams({
      videoUrl: resource.url,
      videoTitle: resource.title,
      resourceId: resource.id || resource.resource_id
    });
  };

  const renderModuleSection = ({ item }: { item: any }) => {
    return (
      <View style={styles.moduleSection}>
        <Text style={styles.moduleName}>{item.name || item.title}</Text>
        {item.videoResources.map((resource: any) => renderVideoItem(resource))}
      </View>
    );
  };
  
  const renderVideoItem = (resource: any) => {
    const isActive = resource.id === resourceId || resource.resource_id === resourceId;
    
    let displayDuration = resource.duration || '00:00';
    if (isActive && actualDuration && actualDuration > 0) {
      const minutes = Math.floor(actualDuration / 60);
      const seconds = actualDuration % 60;
      displayDuration = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else if (resource.actualDuration && resource.actualDuration > 0) {
      const minutes = Math.floor(resource.actualDuration / 60);
      const seconds = resource.actualDuration % 60;
      displayDuration = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    return (
      <TouchableOpacity
        key={resource.id || resource.resource_id}
        style={[styles.videoItem, isActive && styles.activeVideoItem]}
        onPress={() => handleVideoSelect(resource)}
      >
        <View style={styles.videoItemContent}>
          <View style={styles.videoThumbnail}>
            <Image 
              source={resource.thumbnail ? getValidImageSource(resource.thumbnail) : 
                     courseImage ? getValidImageSource(courseImage) : 
                     require('../../assets/images/video-thumbnail.png')} 
              style={styles.thumbnailImage} 
              resizeMode="cover"
            />
            {isActive && (
              <View style={styles.playingIndicator}>
                <Play size={20} color="#fff" />
              </View>
            )}
          </View>
          <View style={styles.videoInfo}>
            <Text style={styles.videoTitle} numberOfLines={2}>
              {resource.videoNumber}. {resource.title}
            </Text>
            <Text style={styles.videoDuration}>{displayDuration}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.PRIMARY} />
        <Text style={styles.loadingText}>Loading video...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <X size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Course Preview</Text>
      </View>
      
      <View style={styles.courseTitle}>
        <Text style={styles.courseTitleText}>{courseTitle || videoTitle}</Text>
      </View>
      
      <View style={[styles.videoContainer, isFullscreen && styles.fullscreenVideo]}>
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            activeOpacity={1}
            style={styles.videoWrapper}
            onPress={handleScreenTouch}
          >
            {player && processedUrl ? (
              <VideoView
                style={styles.video}
                player={player}
              />
            ) : (
              <View style={[styles.video, { backgroundColor: '#000' }]} />
            )}
            
            {showControls && (
              <View style={styles.controls}>
                <TouchableOpacity onPress={togglePlayPause} style={styles.controlButton}>
                  {isPlaying ? (
                    <Pause size={24} color="#fff" />
                  ) : (
                    <Play size={24} color="#fff" />
                  )}
                </TouchableOpacity>
                
                <View style={styles.volumeAndFullscreen}>
                  <TouchableOpacity onPress={toggleMute} style={styles.controlButton}>
                    {player && player.volume === 0 ? (
                      <VolumeX size={24} color="#fff" />
                    ) : (
                      <Volume2 size={24} color="#fff" />
                    )}
                  </TouchableOpacity>
                  
                  <TouchableOpacity onPress={toggleFullscreen} style={styles.controlButton}>
                    {isFullscreen ? (
                      <Minimize size={24} color="#fff" />
                    ) : (
                      <Maximize size={24} color="#fff" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>
      
      {!isFullscreen && !error && (
        <View style={styles.currentVideoInfo}>
          <View style={styles.currentVideoThumbnail}>
            <Image 
              source={flattenedVideoResources[currentResourceIndex]?.thumbnail ? 
                     getValidImageSource(flattenedVideoResources[currentResourceIndex].thumbnail) : 
                     courseImage ? getValidImageSource(courseImage) : 
                     require('../../assets/images/video-thumbnail.png')} 
              style={styles.thumbnailImage}
            />
          </View>
          <View style={styles.currentVideoDetails}>
            <Text style={styles.currentVideoTitle} numberOfLines={2}>
              {flattenedVideoResources[currentResourceIndex]?.title || videoTitle}
            </Text>
            <Text style={styles.currentVideoDuration}>
              {flattenedVideoResources[currentResourceIndex]?.duration || '00:00'}
            </Text>
          </View>
        </View>
      )}
      
      {!isFullscreen && (
        <FlatList
          data={moduleData}
          renderItem={renderModuleSection}
          keyExtractor={(item) => item.id || item.moduleId}
          style={styles.videoList}
          contentContainerStyle={styles.videoListContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  courseTitle: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  courseTitleText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
  },
  fullscreenVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    aspectRatio: undefined,
    height: '100%',
  },
  videoWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  volumeAndFullscreen: {
    flexDirection: 'row',
  },
  controlButton: {
    padding: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  errorText: {
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: Colors.PRIMARY,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  currentVideoInfo: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  currentVideoThumbnail: {
    width: 80,
    height: 45,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#333',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  currentVideoDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  currentVideoTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  currentVideoDuration: {
    color: '#aaa',
    fontSize: 14,
  },
  videoList: {
    flex: 1,
  },
  videoListContent: {
    paddingBottom: 20,
  },
  moduleSection: {
    marginBottom: 16,
  },
  moduleName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1e1e1e',
  },
  videoItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  activeVideoItem: {
    backgroundColor: '#2a2a2a',
  },
  videoItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  videoThumbnail: {
    width: 80,
    height: 50,
    borderRadius: 6,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#444',
  },
  playingIndicator: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoInfo: {
    flex: 1,
    marginLeft: 12,
  },
  videoTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  videoDuration: {
    color: '#aaa',
    fontSize: 12,
  },
});