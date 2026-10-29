import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppState, Linking } from 'react-native';
import * as Location from 'expo-location';

const LocationContext = createContext({
  servicesEnabled: false,
  permissionStatus: 'undetermined',
  isReady: false,
  isChecking: true,
  gpsState: 'checking', // 'checking' | 'off' | 'denied' | 'weak' | 'moderate' | 'strong'
  accuracy: null,
  checkLocationStatus: async () => {},
  requestPermission: async () => {},
  openLocationSettings: () => {},
});

export function LocationProvider({ children }) {
  const [servicesEnabled, setServicesEnabled] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState('undetermined');
  const [gpsState, setGpsState] = useState('checking');
  const [accuracy, setAccuracy] = useState(null);
  const [isChecking, setIsChecking] = useState(true);

  const checkLocationStatus = useCallback(async () => {
    try {
      // 1. Verify device location hardware / services switch
      const servicesOn = await Location.hasServicesEnabledAsync();
      setServicesEnabled(servicesOn);

      if (!servicesOn) {
        setGpsState('off');
        setAccuracy(null);
        setIsChecking(false);
        return false;
      }

      // 2. Verify foreground permission
      const perm = await Location.getForegroundPermissionsAsync();
      setPermissionStatus(perm.status);

      if (perm.status !== 'granted') {
        setGpsState('denied');
        setAccuracy(null);
        setIsChecking(false);
        return false;
      }

      // 3. Check recent position accuracy if available
      try {
        const lastLoc = await Location.getLastKnownPositionAsync();
        if (lastLoc && lastLoc.coords) {
          const acc = lastLoc.coords.accuracy;
          setAccuracy(acc);
          if (acc <= 15) {
            setGpsState('strong');
          } else if (acc <= 45) {
            setGpsState('moderate');
          } else {
            setGpsState('weak');
          }
        } else {
          setGpsState('moderate');
        }
      } catch {
        setGpsState('moderate');
      }

      setIsChecking(false);
      return true;
    } catch {
      setServicesEnabled(false);
      setGpsState('off');
      setIsChecking(false);
      return false;
    }
  }, []);

  const requestPermission = useCallback(async () => {
    try {
      const servicesOn = await Location.hasServicesEnabledAsync();
      setServicesEnabled(servicesOn);
      if (!servicesOn) {
        Linking.openSettings();
        return false;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);
      await checkLocationStatus();
      return status === 'granted';
    } catch {
      return false;
    }
  }, [checkLocationStatus]);

  const openLocationSettings = useCallback(() => {
    Linking.openSettings();
  }, []);

  // Initial check on mount
  useEffect(() => {
    checkLocationStatus();

    // Auto-refresh when app transitions from background / settings back to active
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        checkLocationStatus();
      }
    });

    // Heartbeat check every 10 seconds to catch hardware toggles
    const interval = setInterval(checkLocationStatus, 10000);

    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, [checkLocationStatus]);

  const isReady = servicesEnabled && permissionStatus === 'granted';

  return (
    <LocationContext.Provider
      value={{
        servicesEnabled,
        permissionStatus,
        isReady,
        isChecking,
        gpsState,
        accuracy,
        checkLocationStatus,
        requestPermission,
        openLocationSettings,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}

