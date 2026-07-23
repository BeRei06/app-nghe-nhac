import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePlayer } from '../store/PlayerContext';
import { COLORS } from '../utils/theme';

// Props: { post: { id, user, song, caption, snippet_start, snippet_end, likes, comments }, currentUserId, onDelete }
export default function SnippetCard({ post, currentUserId, onDelete, queue = [], queueIndex = -1 }) {
  const player = usePlayer();
  const [isLiked, setIsLiked] = useState(false);
  const getSongCover = (song) => song?.cover || song?.cover_url || song?.coverImage || song?.cover_image || null;

  const handlePlaySnippet = () => {
    const isSameSnippet =
      player.currentSong?.id === post.song.id &&
      player.snippetRange?.start === post.snippet_start &&
      player.snippetRange?.end === post.snippet_end;

    if (isSameSnippet) {
      player.isPlaying ? player.pause() : player.resume();
    } else {
      player.playSnippet(post.song, post.snippet_start, post.snippet_end, { queue, index: queueIndex });
    }
  };

  const isThisSnippetPlaying =
    player.currentSong?.id === post.song.id &&
    player.snippetRange?.start === post.snippet_start &&
    player.snippetRange?.end === post.snippet_end &&
    player.isPlaying;

  return (
    <View style={styles.container}>
      {/* Card Header */}
      <View style={styles.header}>
        <Image source={{ uri: post.user.avatar || post.user.avatar_url }} style={styles.avatar} />
        <Text style={styles.username}>{post.user.username}</Text>
      </View>

      {/* Caption */}
      <Text style={styles.caption}>{post.caption}</Text>

      {/* Song Snippet Player */}
      <View style={styles.playerContainer}>
        <Image source={{ uri: getSongCover(post.song) }} style={styles.songCover} />
        <View style={styles.songInfo}>
          <Text style={styles.songTitle} numberOfLines={1}>{post.song.title}</Text>
          <Text style={styles.songArtist} numberOfLines={1}>{post.song.artist}</Text>
          <Text style={styles.snippetTime}>
            {`${Math.floor(post.snippet_start / 60)}:${String(post.snippet_start % 60).padStart(2, '0')} - ${Math.floor(post.snippet_end / 60)}:${String(post.snippet_end % 60).padStart(2, '0')}`}
          </Text>
        </View>
        <TouchableOpacity style={styles.playButton} onPress={handlePlaySnippet}>
          <Ionicons name={isThisSnippetPlaying ? 'pause-circle' : 'play-circle'} size={48} color={COLORS.accentPurple} />
        </TouchableOpacity>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => setIsLiked(!isLiked)}>
          <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={24} color={isLiked ? '#E53E3E' : COLORS.foregroundSecondary} />
          <Text style={styles.actionText}>{post.likes + (isLiked ? 1 : 0)}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={24} color={COLORS.foregroundSecondary} />
          <Text style={styles.actionText}>{post.comments}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={async () => {
          try {
            await Share.share({
              message: `Check out this snippet from ${post.song.title} by ${post.song.artist}: ${post.caption}`,
            });
          } catch (error) {
            // ignore user cancel
          }
        }}>
          <Ionicons name="share-social-outline" size={24} color={COLORS.foregroundSecondary} />
        </TouchableOpacity>
        {currentUserId === post.user.id && onDelete ? (
          <TouchableOpacity style={styles.actionButton} onPress={onDelete}>
            <Ionicons name="trash-outline" size={24} color="#E53E3E" />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  username: {
    color: COLORS.foreground,
    fontWeight: 'bold',
    fontSize: 15,
  },
  caption: {
    color: COLORS.foreground,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  playerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundAlt,
    borderRadius: 8,
    padding: 8,
  },
  songCover: {
    width: 50,
    height: 50,
    borderRadius: 6,
  },
  songInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  songTitle: { color: COLORS.foreground, fontSize: 15, fontWeight: '600' },
  songArtist: { color: COLORS.foregroundSecondary, fontSize: 13, marginTop: 2 },
  snippetTime: { color: COLORS.foregroundSecondary, fontSize: 12, marginTop: 4 },
  playButton: { padding: 4 },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  actionButton: { flexDirection: 'row', alignItems: 'center' },
  actionText: { color: COLORS.foregroundSecondary, marginLeft: 6, fontSize: 14 },
});