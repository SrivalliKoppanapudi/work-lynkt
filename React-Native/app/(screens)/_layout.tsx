import React from "react";
import { Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function ScreensLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, margin: 8 }}>
    <SafeAreaView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaView>
    </GestureHandlerRootView>
  );
}
