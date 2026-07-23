import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { navigationRef } from '../navigation';
import { usePlayer } from '../store/PlayerContext';
import { useDevice } from '../store/DeviceContext';
import { COLORS } from '../utils/theme';

export default function MiniPlayer() {
  const { layout } = useDevice();
  const { currentSong, isPlaying, progress, pause, resume } = usePlayer();
  const slideAnim = React.useRef(new Animated.Value(100)).current;

  React.useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: currentSong ? 0 : 100,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [currentSong]);

  if (!currentSong) {
    return null;
  }

  const progressStyle = {
    width: `${progress}%`,
  };

  return (
    <Animated.View style={[
      styles.container,
      { bottom: layout.customTabBarH, transform: [{ translateY: slideAnim }] }
    ]}>
      <View style={[styles.progressBar, progressStyle]} />
      <TouchableOpacity
        style={styles.touchable}
        onPress={() => navigationRef.current?.navigate('Player')}
        activeOpacity={0.9}
      >
        <Image source={{ uri: currentSong.cover }} style={styles.cover} />
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>{currentSong.title}</Text>
          <Text style={styles.artist} numberOfLines={1}>{currentSong.artist}</Text>
        </View>
        <TouchableOpacity style={styles.controlButton} onPress={isPlaying ? pause : resume}>
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={24} color={COLORS.foreground} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 8,
    right: 8,
    height: 64,
    backgroundColor: 'rgba(30, 30, 44, 0.8)', // Glass effect
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  touchable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  progressBar: {
    position: 'absolute',
    height: 2,
    backgroundColor: COLORS.accentPurple,
    bottom: 0,
  },
  cover: { width: 44, height: 44, borderRadius: 8 },
  info: { flex: 1, marginLeft: 12, marginRight: 8 },
  title: { color: COLORS.foreground, fontWeight: '600' },
  artist: { color: COLORS.foregroundSecondary, fontSize: 12, marginTop: 2 },
  controlButton: { padding: 12 },
});