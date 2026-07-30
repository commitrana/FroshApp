import React from "react";
import { SafeAreaProvider, initialWindowMetrics } from "react-native-safe-area-context";
import AppNavigator from "./navigation/AppNavigator";
import { ThemeProvider } from "./context/ThemeContext";
import { NavigationContainer } from '@react-navigation/native';

export default function App() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <ThemeProvider>
        
        <AppNavigator />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}