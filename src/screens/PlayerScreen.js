import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { usePlayer } from '../store/PlayerContext';
import { COLORS } from '../utils/theme';

export default function PlayerScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { currentSong, isPlaying, progress, pause, resume, playPrevious, playNext } = usePlayer();

  const spinValue = useRef(new Animated.Value(0)).current;

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 20000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    if (isPlaying) {
      animation.start();
    } else {
      animation.stop();
    }
    return () => animation.stop();
  }, [isPlaying]);

  if (!currentSong) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>No song playing</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-down" size={28} color={COLORS.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Now Playing</Text>
        <View style={{ width: 28 }} />
      </View>

      <Animated.Image
        source={{ uri: currentSong.cover }}
        style={[styles.cover, { transform: [{ rotate: spin }] }]}
      />

      <View style={styles.details}>
        <Text style={styles.title}>{currentSong.title}</Text>
        <Text style={styles.artist}>{currentSong.artist}</Text>
      </View>

      <View style={styles.progressContainer}>
        <Slider
          style={{ width: '100%', height: 40 }}
          minimumValue={0}
          maximumValue={100}
          value={progress}
          minimumTrackTintColor={COLORS.accentPurple}
          maximumTrackTintColor={COLORS.foregroundSecondary}
          thumbTintColor={COLORS.foreground}
        />
        {/* Time labels would go here */}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity onPress={playPrevious}>
          <Ionicons name="play-skip-back" size={32} color={COLORS.foreground} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.playPauseButton} onPress={isPlaying ? pause : resume}>
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={40} color={COLORS.background} />
        </TouchableOpacity>
        <TouchableOpacity onPress={playNext}>
          <Ionicons name="play-skip-forward" size={32} color={COLORS.foreground} />
        </TouchableOpacity>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom }]}>
        <TouchableOpacity style={styles.footerButton} onPress={() => navigation.navigate('Lyrics', { songId: currentSong.id })}>
          <Ionicons name="mic-outline" size={24} color={COLORS.foregroundSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerButton} onPress={() => navigation.navigate('SnippetCreator', { song: currentSong })}>
          <Ionicons name="cut-outline" size={24} color={COLORS.foregroundSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center' },
  header: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 32 },
  headerTitle: { color: COLORS.foreground, fontSize: 16, fontWeight: '600' },
  cover: { width: 280, height: 280, borderRadius: 140, marginBottom: 48 },
  details: { alignItems: 'center', marginBottom: 32 },
  title: { color: COLORS.foreground, fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  artist: { color: COLORS.foregroundSecondary, fontSize: 16, marginTop: 8 },
  progressContainer: { width: '85%', marginBottom: 24 },
  controls: { width: '70%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 48 },
  playPauseButton: { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.foreground, justifyContent: 'center', alignItems: 'center' },
  footer: { width: '100%', flexDirection: 'row', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 16 },
  footerButton: { alignItems: 'center' },
});