import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { useDevice } from '../store/DeviceContext';
import { getLibraryLikedSongsApi, getLibraryDownloadsApi, getLibraryPlaylistsApi } from '../api/library.api';
import { COLORS } from '../utils/theme';
import SongCard from '../components/SongCard';
import NetInfo from '@react-native-community/netinfo';

const TABS = ['Playlists', 'Liked', 'Downloads'];

export default function LibraryScreen({ navigation }) {
  const { layout } = useDevice();
  const [activeTab, setActiveTab] = useState('Liked');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setLoading(true);
    let apiCall;
    if (activeTab === 'Liked') {
      apiCall = getLibraryLikedSongsApi();
    } else if (activeTab === 'Downloads') {
      apiCall = getLibraryDownloadsApi();
    } else { // Playlists
      apiCall = getLibraryPlaylistsApi();
    }

    apiCall
      .then(res => setData(res.data))
      .finally(() => setLoading(false));
  }, [activeTab]);

  const renderItem = ({ item }) => {
    if (activeTab === 'Playlists') {
      return (
        <TouchableOpacity style={styles.playlistCard}>
          <Image source={{ uri: item.cover }} style={styles.playlistCover} />
          <View style={styles.playlistInfo}>
            <Text style={styles.songTitle}>{item.name}</Text>
            <Text style={styles.songArtist}>{item.song_count} songs</Text>
          </View>
        </TouchableOpacity>
      );
    }
    return <SongCard item={item} onPress={() => navigation.navigate('SongDetail', { id: item.id })} />;
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: layout.safeTop, height: layout.customHeaderH }]}>
        <Text style={styles.headerTitle}>My Library</Text>
      </View>

      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>You are offline. Only downloaded content is available.</Text>
        </View>
      )}

      <View style={styles.tabContainer}>
        {TABS.map(tab => (
          <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            {activeTab === tab && <View style={styles.activeTabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color={COLORS.accentPurple} />
      ) : (
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16, paddingBottom: layout.contentPaddingBottom }}
          ListEmptyComponent={<Text style={styles.emptyText}>No items in this section.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: COLORS.backgroundAlt,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.foreground },
  offlineBanner: { backgroundColor: '#F59E0B', padding: 8, alignItems: 'center' },
  offlineText: { color: '#000', fontSize: 12, fontWeight: '500' },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    backgroundColor: COLORS.backgroundAlt,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tabText: { color: COLORS.foregroundSecondary, fontSize: 16, paddingBottom: 12 },
  tabTextActive: { color: COLORS.foreground, fontWeight: 'bold' },
  activeTabIndicator: {
    height: 3,
    width: '60%',
    alignSelf: 'center',
    backgroundColor: COLORS.accentPurple,
    borderRadius: 2,
  },
  emptyText: { color: COLORS.foregroundSecondary, textAlign: 'center', marginTop: 50, fontSize: 16 },
  playlistCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  playlistCover: { width: 48, height: 48, borderRadius: 6 },
  playlistInfo: { flex: 1, marginLeft: 12 },
  songTitle: { color: COLORS.foreground, fontSize: 15, fontWeight: '600' },
  songArtist: { color: COLORS.foregroundSecondary, fontSize: 13, marginTop: 2 },
});