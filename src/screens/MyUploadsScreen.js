import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../utils/theme';
import SongCard from '../components/SongCard';
import { getMySongsApi, deleteSongApi } from '../api/song.api';

export default function MyUploadsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadSongs = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await getMySongsApi();
      const songs = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
        ? response.data
        : [];
      setSongs(songs.map((song) => ({
        ...song,
        cover: song.cover || song.cover_url || null,
      })));
    } catch (error) {
      console.warn('[MyUploadsScreen] getMySongsApi error', error);
      Alert.alert('Lỗi', error.message || 'Không thể tải danh sách bài hát.');
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadSongs();
  }, []);

  const handleDeleteSong = (songId) => {
    Alert.alert(
      'Xóa bài hát',
      'Bạn có chắc muốn xóa bài hát này không?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSongApi(songId);
              setSongs((prevSongs) => prevSongs.filter((song) => song.id !== songId));
            } catch (error) {
              Alert.alert('Lỗi', error.message || 'Không thể xóa bài hát.');
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }) => (
    <SongCard
      item={item}
      subtitle={item.status ? `Trạng thái: ${item.status}` : undefined}
      onPress={() => navigation.navigate('SongDetail', { id: item.id })}
      actionIcon="trash-outline"
      actionColor="#E53E3E"
      onActionPress={() => handleDeleteSong(item.id)}
    />
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}> 
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bài hát của tôi</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={() => loadSongs(true)}>
          <Text style={styles.refreshButtonText}>{refreshing ? 'Đang tải...' : 'Làm mới'}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.accentPurple} />
        </View>
      ) : songs.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Bạn chưa upload bài hát nào.</Text>
          <Text style={styles.subText}>Hãy upload một bài hát để xem nó ở đây.</Text>
        </View>
      ) : (
        <FlatList
          data={songs}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          ListFooterComponent={<View style={{ height: insets.bottom + 16 }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.backgroundAlt,
  },
  headerTitle: {
    color: COLORS.foreground,
    fontSize: 20,
    fontWeight: '700',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    color: COLORS.foreground,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  refreshButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: COLORS.accentPurple,
    borderRadius: 999,
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  subText: {
    color: COLORS.foregroundSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 0,
  },
});
