# Theme System Documentation

## Overview

This document provides guidance on how to use the theme system in the React Native application. The theme system supports light and dark modes, with the ability to switch between them manually or follow the system preference.

## Theme Context

The theme system is built around a React Context (`ThemeContext`) that provides theme-related values and functions to all components in the application.

### Available Theme Values

- `theme`: The current theme object containing all color values
- `isDark`: Boolean indicating if dark mode is active
- `toggleTheme`: Function to toggle between light and dark mode
- `setThemeMode`: Function to set a specific theme mode ('light', 'dark', or 'system')
- `themeMode`: Current theme mode setting

## Using Theme in Components

### Accessing Theme Values

You can access the theme values in any component using the `useTheme` hook:

```jsx
import { useTheme } from '../Context/theme';

const MyComponent = () => {
  const { theme, isDark } = useTheme();
  
  return (
    <View style={{ backgroundColor: theme.BACKGROUND }}>
      <Text style={{ color: theme.TEXT }}>Hello World</Text>
    </View>
  );
};
```

### Themed Components

The application provides pre-built themed components that automatically adapt to the current theme:

#### ThemedView

```jsx
import { ThemedView } from '../component/ThemedView';

<ThemedView style={styles.container}>
  {/* Your content */}
</ThemedView>
```

#### ThemedText

```jsx
import { ThemedText } from '../component/ThemedView';

<ThemedText>Primary text</ThemedText>
<ThemedText type="secondary">Secondary text</ThemedText>
<ThemedText type="tertiary">Tertiary text</ThemedText>
```

#### ThemedCard

```jsx
import ThemedCard from '../component/ThemedCard';

<ThemedCard 
  title="Card Title"
  description="Card description"
  onPress={() => console.log('Card pressed')}
/>
```

### Theme Toggle

You can add a theme toggle component to allow users to switch between light and dark modes:

```jsx
import ThemeToggle from '../component/ThemeToggle';

<ThemeToggle showLabel={true} />
```

## Theme Colors

### Light Theme Colors

```
WHITE: '#FFFFFF'
PRIMARY: '#0075ff'
ERROR: 'red'
SUCCESS: 'green'
DANGER: 'red'
BLACK: 'black'
GRAY: 'gray'
BACKGROUND: '#FFFFFF'
TEXT: '#1f2937'
CARD_BACKGROUND: '#f9fafb'
BORDER: '#e5e7eb'
SECONDARY_TEXT: '#4b5563'
TERTIARY_TEXT: '#6b7280'
BADGE_BACKGROUND: '#e5e7eb'
BADGE_TEXT: '#4b5563'
```

### Dark Theme Colors

```
WHITE: '#1a1a1a'
PRIMARY: '#0075ff'
ERROR: '#ff6b6b'
SUCCESS: '#4cd964'
DANGER: '#ff6b6b'
BLACK: '#ffffff'
GRAY: '#a0a0a0'
BACKGROUND: '#121212'
TEXT: '#f3f4f6'
CARD_BACKGROUND: '#2a2a2a'
BORDER: '#3a3a3a'
SECONDARY_TEXT: '#d1d5db'
TERTIARY_TEXT: '#9ca3af'
BADGE_BACKGROUND: '#3a3a3a'
BADGE_TEXT: '#d1d5db'
```

## Best Practices

1. Always use the themed components or the `useTheme` hook for UI elements that should adapt to theme changes.
2. Avoid hardcoding colors in your components. Use the theme colors instead.
3. For custom components, create themed versions that use the theme context.
4. Test your UI in both light and dark modes to ensure proper contrast and readability.
5. When adding new colors to the theme, add them to both light and dark theme objects.