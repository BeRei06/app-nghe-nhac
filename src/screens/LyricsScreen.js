import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../utils/theme';

export default function LyricsScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { songId } = route.params;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>Lyrics</Text>
      <Text style={styles.subtitle}>For song ID: {songId}</Text>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.lyricsText}>
          (Lyrics will be displayed here...)
          {'\n\n'}
          Line 1 of the song
          {'\n'}
          Line 2 of the song
          {'\n'}
          Line 3 of the song (current line)
          {'\n'}
          Line 4 of the song
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.foreground,
    textAlign: 'center',
    marginVertical: 16,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.foregroundSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  content: {
    alignItems: 'center',
  },
  lyricsText: {
    color: COLORS.foregroundSecondary,
    fontSize: 18,
    lineHeight: 32,
    textAlign: 'center',
  },
});