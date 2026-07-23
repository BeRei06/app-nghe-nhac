import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { getRecommendedApi, getTopChartApi } from '../api/song.api';
import { useAuth } from '../store/AuthContext';
import { useDevice } from '../store/DeviceContext';
import { COLORS } from '../utils/theme';
import { Ionicons } from '@expo/vector-icons';

const TRENDING_HASHTAGS = ['#Chill', '#Indie', '#LoFi', '#SadVibes', '#NhacCuoiTuan', '#Rock90s'];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Chào buổi sáng';
  if (h < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
}

export default function HomeScreen({ navigation }) {
  const { user, tasteTags } = useAuth();
  const { layout } = useDevice();
  const [recommended, setRecommended] = useState([]);
  const [topChart, setTopChart] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [recommendedResult, topChartResult] = await Promise.allSettled([
        getRecommendedApi({ tags: tasteTags.join(',') }),
        getTopChartApi(),
      ]);

      const recommendedRes = recommendedResult.status === 'fulfilled' ? recommendedResult.value : [];
      const topChartRes = topChartResult.status === 'fulfilled' ? topChartResult.value : [];
      setRecommended(recommendedRes?.data || recommendedRes || []);
      setTopChart(topChartRes?.data || topChartRes || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tasteTags]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: layout.safeTop, height: layout.customHeaderH }]}> 
        <View>
          <Text style={styles.greeting}>{getGreeting()}, {user?.username || 'bạn'} 👋</Text>
          <Text style={styles.headerSubtitle}>Hãy khám phá âm nhạc mới</Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity onPress={() => navigation.navigate('Search')}>
            <Ionicons name="search-outline" size={24} color={COLORS.foreground} />
          </TouchableOpacity>
          <TouchableOpacity style={{ marginLeft: 16 }} onPress={() => navigation.navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={24} color={COLORS.foreground} />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.accentPurple} />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: layout.contentPaddingBottom }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Trending Now</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hashtagList}>
              {TRENDING_HASHTAGS.map((tag) => (
                <TouchableOpacity key={tag} style={styles.hashtagChip} onPress={() => navigation.navigate('Search', { hashtag: tag })}>
                  <Text style={styles.hashtagText}>{tag}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Gợi ý cho bạn</Text>
              <TouchableOpacity onPress={() => {}}>
                <Text style={styles.seeAll}>Xem thêm</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.grid}>
              {recommended.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.gridItem}
                  onPress={() => navigation.navigate('SongDetail', { id: item.id })}
                  activeOpacity={0.85}
                >
                  <Image source={{ uri: item.cover }} style={styles.gridImage} />
                  <View style={styles.gridOverlay} />
                  <View style={styles.gridPlay}>
                    <Ionicons name="play" size={18} color="#fff" />
                  </View>
                  <Text style={styles.gridTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.gridSubtitle} numberOfLines={1}>{item.artist || item.uploader?.username || 'Unknown Artist'}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Top Chart</Text>
              <TouchableOpacity onPress={() => {}}>
                <Text style={styles.seeAll}>Xem tất cả</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.chartList}>
              {topChart.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.chartRow}
                  onPress={() => navigation.navigate('SongDetail', { id: item.id })}
                  activeOpacity={0.85}
                >
                  <Text style={styles.chartRank}>{index + 1}</Text>
                  <Image source={{ uri: item.cover }} style={styles.chartCover} />
                  <View style={styles.chartInfo}>
                    <Text style={styles.chartTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.chartArtist} numberOfLines={1}>{item.artist || item.uploader?.username || 'Unknown Artist'}</Text>
                  </View>
                  <Text style={styles.chartDuration}>{item.duration ? `${Math.floor(item.duration / 60)}:${String(item.duration % 60).padStart(2, '0')}` : '--:--'}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: COLORS.bgSurface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  greeting: { fontSize: 20, fontWeight: '700', color: COLORS.foreground },
  headerSubtitle: { fontSize: 13, color: COLORS.foregroundSecondary, marginTop: 4 },
  headerIcons: { flexDirection: 'row', alignItems: 'center' },
  section: { marginTop: 24 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: COLORS.foreground },
  seeAll: { fontSize: 13, color: COLORS.accentPurple, fontWeight: '600' },
  hashtagList: { paddingLeft: 16, paddingRight: 8 },
  hashtagChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.accentPurple + '33',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  gridItem: { width: '48%', marginBottom: 16 },
  gridImage: { width: '100%', aspectRatio: 1, borderRadius: 22 },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  gridPlay: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    width: 38,
    height: 38,
    borderRadius: 20,
    backgroundColor: COLORS.accentPurple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridTitle: { color: COLORS.foreground, fontWeight: '700', marginTop: 10 },
  gridSubtitle: { color: COLORS.foregroundSecondary, fontSize: 12 },
  chartList: { paddingHorizontal: 16 },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: COLORS.card,
    borderRadius: 18,
    marginBottom: 10,
  },
  chartRank: {
    width: 30,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.accentPurple,
    textAlign: 'center',
  },
  chartCover: {
    width: 56,
    height: 56,
    borderRadius: 16,
    marginLeft: 10,
  },
  chartInfo: {
    flex: 1,
    marginLeft: 12,
  },
  chartTitle: {
    color: COLORS.foreground,
    fontSize: 15,
    fontWeight: '700',
  },
  chartArtist: {
    color: COLORS.foregroundSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  chartDuration: {
    color: COLORS.foregroundSecondary,
    fontSize: 12,
  },
});
