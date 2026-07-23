import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/theme';

// Simple native SplashScreen for the Expo app.
// Receives `onFinish()` prop (used by AppNavigator to move past splash).
export default function SplashScreen({ onFinish }) {
  const scale = useRef(new Animated.Value(0.8)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulsing animation for logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.95, duration: 700, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      ])
    ).start();

    // Rotating accent
    Animated.loop(
      Animated.timing(rotate, { toValue: 1, duration: 3000, easing: Easing.linear, useNativeDriver: true })
    ).start();

    // Keep splash short and then notify navigator
    const t = setTimeout(() => {
      if (typeof onFinish === 'function') onFinish();
    }, 1400);

    return () => clearTimeout(t);
  }, [scale, rotate, onFinish]);

  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <Animated.View style={[styles.logoWrap, { transform: [{ scale }] }]}>
        <Animated.View style={[styles.accentRing, { transform: [{ rotate: spin }] }]} />
        <View style={styles.logoInner}>
          <Ionicons name="musical-notes" size={52} color="#fff" />
        </View>
      </Animated.View>
      <Text style={styles.title}>VibeShare</Text>
      <Text style={styles.subtitle}>Share your music moments</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logoWrap: {
    width: 140,
    height: 140,
    borderRadius: 140 / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    backgroundColor: COLORS.accentPurple,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  accentRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: COLORS.accentBlue,
    opacity: 0.22,
  },
  logoInner: {
    width: 88,
    height: 88,
    borderRadius: 88 / 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: COLORS.foreground,
    fontSize: 24,
    fontWeight: '700',
    marginTop: 6,
  },
  subtitle: {
    color: COLORS.foregroundSecondary,
    fontSize: 14,
    marginTop: 6,
  },
});
