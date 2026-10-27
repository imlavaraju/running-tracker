import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { RunProvider } from '../contexts/RunContext';
import { SettingsProvider } from '../contexts/SettingsContext';

export default function RootLayout() {
  return (
    <SettingsProvider>
      <RunProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="run"
            options={{
              presentation: 'fullScreenModal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="run-details/[id]"
            options={{
              headerShown: true,
              headerTitle: 'Run Details',
              headerBackTitle: 'Back',
            }}
          />
          <Stack.Screen
            name="settings"
            options={{
              presentation: 'modal',
              headerShown: true,
              headerTitle: 'Settings',
            }}
          />
        </Stack>
      </RunProvider>
    </SettingsProvider>
  );
}

