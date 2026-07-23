import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { searchApi } from '../api/search.api';
import { COLORS } from '../utils/theme';
import SongCard from '../components/SongCard';

const SEARCH_TYPES = ['All', 'Songs', 'Artists'];
const TRENDING_HASHTAGS = ['#Chill', '#Indie', '#Mood', '#Dance', '#Relax', '#NewRelease'];
const POPULAR_SONGS = [
  { id: 1, title: 'Blinding Lights', artist: 'The Weeknd', cover: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36', duration: 200 },
  { id: 2, title: 'As It Was', artist: 'Harry Styles', cover: 'https://i.scdn.co/image/ab67616d0000b273b46f74097655d7f353caab14', duration: 167 },
  { id: 3, title: 'Levitating', artist: 'Dua Lipa', cover: 'https://i.scdn.co/image/ab67616d0000b273bd252363a093155532da8793', duration: 203 },
  { id: 4, title: 'Good 4 U', artist: 'Olivia Rodrigo', cover: 'https://i.scdn.co/image/ab67616d0000b273a91c10fe9472d9bd89802e5a', duration: 178 },
];

export default function SearchScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState(route?.params?.hashtag?.replace('#', '') || '');
  const [activeType, setActiveType] = useState('All');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const handler = setTimeout(() => {
      searchApi({ q: query, type: activeType.toLowerCase() })
        .then((res) => setResults(res.data))
        .catch(() => setResults(null))
        .finally(() => setLoading(false));
    }, 500);

    return () => clearTimeout(handler);
  }, [query, activeType]);

  const renderResultItem = ({ item }) => (
    <SongCard item={item} onPress={() => navigation.navigate('SongDetail', { id: item.id })} />
  );

  const renderArtistResult = ({ item }) => (
    <TouchableOpacity style={styles.artistCard} onPress={() => {}} activeOpacity={0.85}>
      <Image source={item.avatar_url || item.avatar ? { uri: item.avatar_url || item.avatar } : undefined} style={styles.artistAvatar} />
      <View style={styles.artistInfo}>
        <Text style={styles.artistName}>{item.name}</Text>
        <Text style={styles.artistMeta}>Artist</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}> 
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={COLORS.foregroundSecondary} />
          <TextInput
            style={styles.input}
            placeholder="Search songs, artists, users..."
            placeholderTextColor={COLORS.foregroundSecondary}
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButton}>Cancel</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        {SEARCH_TYPES.map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.chip, activeType === type && styles.chipActive]}
            onPress={() => setActiveType(type)}
          >
            <Text style={[styles.chipText, activeType === type && styles.chipTextActive]}>{type}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {query.trim().length < 2 ? (
        <ScrollView contentContainerStyle={styles.emptyStateContainer}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trending Searches</Text>
            <View style={styles.trendingRow}>
              {TRENDING_HASHTAGS.map((tag) => (
                <TouchableOpacity key={tag} style={styles.tagButton} onPress={() => setQuery(tag.replace('#', ''))}>
                  <Text style={styles.tagText}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Popular This Week</Text>
            <View style={styles.popularGrid}>
              {POPULAR_SONGS.map((song) => (
                <TouchableOpacity key={song.id} style={styles.popularCard} onPress={() => navigation.navigate('SongDetail', { id: song.id })} activeOpacity={0.85}>
                  <Image source={{ uri: song.cover }} style={styles.popularCover} />
                  <Text style={styles.popularTitle} numberOfLines={1}>{song.title}</Text>
                  <Text style={styles.popularArtist} numberOfLines={1}>{song.artist}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      ) : loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={COLORS.accentPurple} />
      ) : (
        <FlatList
          data={activeType === 'Artists' ? results?.artists || [] : results?.songs || []}
          renderItem={activeType === 'Artists' ? renderArtistResult : renderResultItem}
          keyExtractor={(item) => `${activeType}-${item.id}`}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.emptyText}>No results found for "{query}"</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundAlt,
    borderRadius: 12,
    height: 44,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    color: COLORS.foreground,
    fontSize: 16,
    marginLeft: 10,
  },
  cancelButton: {
    color: COLORS.accentBlue,
    fontSize: 16,
    marginLeft: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: COLORS.card,
    marginRight: 10,
  },
  chipActive: {
    backgroundColor: COLORS.accentPurple,
  },
  chipText: {
    color: COLORS.foreground,
    fontSize: 14,
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  emptyStateContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: COLORS.foreground,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  trendingRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  tagButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: COLORS.card,
    borderRadius: 999,
    marginBottom: 10,
    marginRight: 10,
  },
  tagText: {
    color: COLORS.foreground,
    fontSize: 13,
  },
  popularGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  popularCard: {
    width: '48%',
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 12,
    marginBottom: 14,
  },
  popularCover: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    marginBottom: 10,
  },
  popularTitle: {
    color: COLORS.foreground,
    fontWeight: '700',
    marginBottom: 4,
  },
  popularArtist: {
    color: COLORS.foregroundSecondary,
    fontSize: 13,
  },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  emptyText: { color: COLORS.foregroundSecondary, textAlign: 'center', marginTop: 40 },
  artistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    marginHorizontal: 16,
  },
  artistAvatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    marginRight: 12,
  },
  artistInfo: {
    flex: 1,
  },
  artistName: {
    color: COLORS.foreground,
    fontWeight: '700',
    fontSize: 15,
  },
  artistMeta: {
    color: COLORS.foregroundSecondary,
    fontSize: 13,
  },
});
