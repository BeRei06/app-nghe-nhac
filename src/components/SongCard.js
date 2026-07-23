import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/theme';

// Props: { item, onPress, subtitle, actionIcon, onActionPress, actionColor, compact, horizontal }
export default function SongCard({ item, onPress, subtitle, actionIcon, onActionPress, actionColor, compact, horizontal }) {
  const formatDuration = (seconds) => {
    const duration = Number(seconds) || 0;
    const minutes = Math.floor(duration / 60);
    const remainingSeconds = duration % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const coverUrl = item.cover || item.cover_url || item.coverImage || item.cover_image;
  const coverSource = coverUrl ? { uri: coverUrl } : null;
  const artistName = item.artist || item.creator?.username || item.uploader?.username || 'Unknown Artist';

  return (
    <TouchableOpacity
      style={[styles.container, compact && styles.compactContainer, horizontal && styles.horizontalContainer]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {coverSource ? (
        <Image
          source={coverSource}
          style={[styles.cover, compact && styles.compactCover, horizontal && styles.horizontalCover]}
        />
      ) : (
        <View style={[styles.cover, styles.coverPlaceholder, compact && styles.compactCover, horizontal && styles.horizontalCover]}>
          <Ionicons name="musical-notes" size={20} color={COLORS.foregroundSecondary} />
        </View>
      )}

      <View style={[styles.info, compact && styles.compactInfo, horizontal && styles.horizontalInfo]}>
        <Text style={[styles.title, compact && styles.compactTitle]} numberOfLines={1}>{item.title}</Text>
        <Text style={[styles.artist, compact && styles.compactArtist]} numberOfLines={1}>{subtitle || artistName}</Text>
      </View>

      {!compact && (
        <View style={[styles.meta, horizontal && styles.horizontalMeta]}>
          <Ionicons name="time-outline" size={14} color={COLORS.foregroundSecondary} />
          <Text style={styles.duration}>{formatDuration(item.duration)}</Text>
        </View>
      )}

      {actionIcon && onActionPress ? (
        <TouchableOpacity style={styles.actionButton} onPress={onActionPress}>
          <Ionicons name={actionIcon} size={22} color={actionColor || COLORS.foregroundSecondary} />
        </TouchableOpacity>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 12,
  },
  compactContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    backgroundColor: 'transparent',
  },
  horizontalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  cover: {
    width: 48,
    height: 48,
    borderRadius: 14,
    marginRight: 12,
  },
  compactCover: {
    width: '100%',
    height: 160,
    borderRadius: 18,
    marginRight: 0,
    marginBottom: 10,
  },
  horizontalCover: {
    width: 72,
    height: 72,
  },
  coverPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundAlt,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  compactInfo: {
    paddingHorizontal: 8,
  },
  horizontalInfo: {
    flex: 1,
  },
  title: {
    color: COLORS.foreground,
    fontSize: 15,
    fontWeight: '600',
  },
  compactTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  artist: {
    color: COLORS.foregroundSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  compactArtist: {
    color: COLORS.foregroundSecondary,
    fontSize: 12,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  horizontalMeta: {
    marginLeft: 0,
  },
  duration: {
    color: COLORS.foregroundSecondary,
    fontSize: 13,
    marginLeft: 4,
  },
  actionButton: {
    marginLeft: 10,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
