import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useDevice } from '../store/DeviceContext';
import { getFeedApi } from '../api/feed.api.js';
import SnippetCard from '../components/SnippetCard.js';
import { COLORS } from '../utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../store/AuthContext';
import { deletePostApi } from '../api/feed.api.js';

export default function FeedScreen({ navigation }) {
  const { layout } = useDevice();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFeed = async () => {
    setLoading(true);
    try {
      const res = await getFeedApi();
      const feedPosts = Array.isArray(res)
        ? res
        : res?.data?.data || res?.data || [];

      setPosts(
        feedPosts.map((post) => ({
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
      // In a real app, show an error message
    } finally {
      setLoading(false);
    }
  };

  const { user } = useAuth();

  useFocusEffect(
    useCallback(() => {
      fetchFeed();
    }, [])
  );

  const handleDeletePost = async (postId) => {
    Alert.alert(
      'Xóa bài đăng',
      'Bạn có chắc muốn xóa bài đăng này không?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePostApi(postId);
              setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
            } catch (error) {
              Alert.alert('Lỗi', error.message || 'Không thể xóa bài đăng.');
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item, index }) => (
    <SnippetCard
      post={item}
      currentUserId={user?.id}
      onDelete={() => handleDeletePost(item.id)}
      queue={posts}
      queueIndex={index}
    />
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: layout.safeTop, height: layout.customHeaderH }]}>
        <Text style={styles.headerTitle}>Feed</Text>
        <TouchableOpacity onPress={() => navigation.navigate('SnippetCreator', { 
            // Pass a default song. In a real app, user would select a song first.
            song: { id: 5, title: 'Stay', artist: 'The Kid LAROI, Justin Bieber', cover: 'https://i.scdn.co/image/ab67616d0000b27341e31d6ea1d4633609347a76', duration: 141 }
        })}>
          <Ionicons name="add-circle-outline" size={28} color={COLORS.foreground} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} size="large" color={COLORS.accentPurple} />
      ) : (
        <FlatList
          data={posts}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16, paddingBottom: layout.contentPaddingBottom }}
          ListEmptyComponent={<Text style={styles.emptyText}>Your feed is empty.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: COLORS.backgroundAlt,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.foreground },
  emptyText: { color: COLORS.foregroundSecondary, textAlign: 'center', marginTop: 50, fontSize: 16 },
});