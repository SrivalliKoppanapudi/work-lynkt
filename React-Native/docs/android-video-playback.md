# Android Video Playback Configuration

This document outlines how video playback is configured for Android devices in the Lynkt app.

## Current Implementation

### Dependencies
- **react-native-video**: v6.12.0 (latest)
- **expo-av**: Used for cross-platform compatibility with Expo

### ExoPlayer Configuration
Android uses ExoPlayer for native video playback via the following configuration in `react-native.config.js`:

```javascript
module.exports = {
  dependencies: {
    "react-native-video": {
      platforms: {
        android: {
          sourceDir: "../node_modules/react-native-video/android-exoplayer",
        },
      },
    },
  },
};
```

### Component Implementations

#### VideoScreen.tsx
- Primarily uses native player (ExoPlayer) for Android
- Falls back to WebView only if native player fails multiple times
- Uses absolute positioning for video elements to ensure proper layout

#### EnhancedVideoPlayer.tsx
- Uses proper styling for better Android compatibility (position: absolute)
- Implements robust error handling and retry logic

## Troubleshooting

If videos aren't playing on Android devices:

1. **Check Video Format**: Ensure videos are in supported formats (MP4 is most reliable)
2. **Test Network**: Make sure the device has a stable internet connection
3. **Check Logs**: Look for specific error messages in the console (may indicate format issues)
4. **Force WebView**: Use the debug button in VideoScreen to force WebView mode if needed

## Supported Video Formats

- **MP4**: Best compatibility across devices
- **WebM**: Supported but may have issues on some Android devices
- **MOV**: Limited support on Android
- **AVI/MKV/FLV**: Poor support, not recommended

## Future Improvements

- Consider implementing a custom ExoPlayer wrapper for more control
- Add support for adaptive streaming (HLS, DASH)
- Improve caching for better offline playback 