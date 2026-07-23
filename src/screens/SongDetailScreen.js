import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getSongByIdApi, deleteSongApi } from '../api/song.api';
import { getSongPostsApi, deletePostApi } from '../api/feed.api.js';
import { COLORS } from '../utils/theme';
import Button from '../components/Button';
import { usePlayer } from '../store/PlayerContext';
import { useAuth } from '../store/AuthContext';
import SnippetCard from '../components/SnippetCard';

export default function SongDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const insets = useSafeAreaInsets();
  const player = usePlayer();
  const { user } = useAuth();

  const [song, setSong] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [snippets, setSnippets] = useState([]);
  const [snippetsLoading, setSnippetsLoading] = useState(false);

  const normalizeCover = (item) => item?.cover || item?.cover_url || item?.coverImage || item?.cover_image || null;

  useEffect(() => {
    getSongByIdApi(id)
      .then((response) => setSong({ ...response, cover: normalizeCover(response) }))
      .catch((err) => Alert.alert('Error', err.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const fetchSnippets = async () => {
      if (!song?.id) {
        return;
      }
      setSnippetsLoading(true);
      try {
        const response = await getSongPostsApi(song.id);
        const posts = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.data?.data)
          ? response.data.data
          : [];

        setSnippets(
          posts.map((post) => ({
            ...post,
            user: post.User || post.user,
            song: {
              ...(post.song || {}),
              cover: post.song?.cover || post.song?.cover_url || post.song?.coverImage || post.song?.cover_image || null,
            },
            snippet_start: post.snippet_start_time ?? post.snippet_start,
            snippet_end: post.snippet_end_time ?? post.snippet_end,
            likes: post.reaction_count ?? post.likes,
          }))
        );
      } catch (error) {
        console.warn('[SongDetailScreen] getSongPostsApi error', error);
      } finally {
        setSnippetsLoading(false);
      }
    };

    fetchSnippets();
  }, [song?.id]);

  const handlePlay = () => {
    if (song) {
      player.play(song);
      navigation.navigate('Player');
    }
  };

  const handleDeleteSong = () => {
    Alert.alert(
      'Xóa bài hát',
      'Bạn có chắc muốn xóa bài hát này không? Hành động này không thể hoàn tác.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteSongApi(song.id);
              Alert.alert('Đã xóa', 'Bài hát của bạn đã được xóa.');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Lỗi', error.message || 'Không thể xóa bài hát.');
            } finally {
              setDeleting(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.accentPurple} />
      </View>
    );
  }

  if (!song) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Song not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: song.cover }} style={styles.cover} />
      <View style={styles.header}>
        <Text style={styles.title}>{song.title}</Text>
        <Text style={styles.artist}>{song.artist}</Text>
      </View>
      
      <View style={styles.actions}>
        <Button title="Play Full Song" onPress={handlePlay} />
        <Button
          title="Create Snippet"
          variant="outline"
          onPress={() => navigation.navigate('SnippetCreator', { song })}
          style={styles.createSnippetButton}
        />
        {user?.id === song?.creator?.id ? (
          <Button
            title="Xóa bài hát"
            variant="outline"
            onPress={handleDeleteSong}
            loading={deleting}
            style={styles.deleteButton}
          />
        ) : null}
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{Number(song.streams || 0).toLocaleString()}</Text>
          <Text style={styles.statLabel}>Streams</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{Number(song.duration || 0)}s</Text>
          <Text style={styles.statLabel}>Duration</Text>
        </View>
      </View>
      
      {/* Placeholder for Snippets list */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Snippets using this song</Text>
        {snippetsLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="small" color={COLORS.accentPurple} />
          </View>
        ) : snippets.length === 0 ? (
          <View style={styles.emptySnippets}>
            <Text style={styles.emptySnippetsText}>No snippets created yet.</Text>
          </View>
        ) : (
          snippets.map((post) => (
            <SnippetCard
              key={post.id}
              post={post}
              currentUserId={user?.id}
              onDelete={() => {
                Alert.alert(
                  'Xóa snippet',
                  'Bạn có chắc muốn xóa snippet này không?',
                  [
                    { text: 'Hủy', style: 'cancel' },
                    {
                      text: 'Xóa',
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          await deletePostApi(post.id);
                          setSnippets((prev) => prev.filter((item) => item.id !== post.id));
                        } catch (error) {
                          Alert.alert('Lỗi', error.message || 'Không thể xóa snippet.');
                        }
                      }
                    }
                  ]
                );
              }}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  errorText: {
    color: COLORS.foregroundSecondary,
    fontSize: 16,
  },
  cover: {
    width: '100%',
    height: 300,
  },
  header: {
    padding: 16,
  },
  title: {
    color: COLORS.foreground,
    fontSize: 24,
    fontWeight: 'bold',
  },
  artist: {
    color: COLORS.accentBlue,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 4,
  },
  actions: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    marginTop: 16,
    backgroundColor: COLORS.backgroundAlt,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: COLORS.foreground,
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    color: COLORS.foregroundSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  createSnippetButton: {
    marginTop: 12,
    width: '100%',
  },
  deleteButton: {
    marginTop: 12,
    width: '100%',
  },
  sectionTitle: {
    color: COLORS.foreground,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  emptySnippets: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
  },
  emptySnippetsText: {
    color: COLORS.foregroundSecondary,
  },
});