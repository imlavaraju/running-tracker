import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RunProvider } from '../contexts/RunContext';
import { SettingsProvider } from '../contexts/SettingsContext';
import { LocationProvider } from '../contexts/LocationContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <LocationProvider>
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
                name="running-test"
                options={{
                  presentation: 'fullScreenModal',
                  animation: 'slide_from_bottom',
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
              <Stack.Screen
                name="reminders"
                options={{
                  headerShown: true,
                  headerTitle: 'Run Reminders',
                  headerBackTitle: 'Settings',
                }}
              />
            </Stack>
          </RunProvider>
        </SettingsProvider>
      </LocationProvider>
    </SafeAreaProvider>
  );
}
