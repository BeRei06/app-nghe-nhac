import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/store/AuthContext';
import { PlayerProvider } from './src/store/PlayerContext';
import { DeviceProvider } from './src/store/DeviceContext';
import AppNavigator from './src/navigation';
import DebugOverlay from './src/components/DebugOverlay';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <PlayerProvider>
          <DeviceProvider>
            <StatusBar style="light" />
            <AppNavigator />
            <DebugOverlay />
          </DeviceProvider>
        </PlayerProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
