import React, { useState } from 'react';
import { ActivityIndicator, View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity, Image } from 'react-native';
import { useAuth } from '../store/AuthContext';
import { useDevice } from '../store/DeviceContext';
import { COLORS } from '../utils/theme';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const { layout } = useDevice();
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Mock data for user stats and posts
  const userStats = { posts: 12, followers: 1250, following: 150 };
  const userPosts = new Array(12).fill(0).map((_, i) => ({
    id: i,
    cover: `https://picsum.photos/seed/${user?.id || 'user'}${i}/200`,
  }));

  const StatItem = ({ label, value }) => (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const completeLogout = async () => {
    console.log('[ProfileScreen] completeLogout start');
    setLogoutLoading(true);
    const success = await logout();
    console.log('[ProfileScreen] logout result', { success });
    setLogoutLoading(false);

    if (success) {
      console.log('[ProfileScreen] logout success, auth state cleared');
      Alert.alert('Đăng xuất', 'Bạn đã đăng xuất thành công.');
      return;
    }

    console.log('[ProfileScreen] logout failed, local cleanup only');
    Alert.alert('Đăng xuất', 'Có lỗi khi đăng xuất. Dữ liệu cục bộ vẫn đã được xóa.');
  };

  const handleLogout = () => {
    console.log('[ProfileScreen] handleLogout pressed');
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: completeLogout,
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.header, { paddingTop: layout.safeTop }]}> 
        <TouchableOpacity onPress={() => navigation.navigate('UploadStudio')} disabled={logoutLoading}>
          <Ionicons name="cloud-upload-outline" size={26} color={COLORS.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={handleLogout} disabled={logoutLoading} style={[styles.logoutAction, styles.logoutTextButton]}>
          {logoutLoading ? (
            <ActivityIndicator size="small" color={COLORS.foreground} />
          ) : (
            <Text style={styles.logoutActionText}>Đăng xuất</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.profileInfo}>
        <Image
          style={styles.avatar}
          source={{ uri: user?.avatar || `https://i.pravatar.cc/150?u=${user?.email}` }}
        />
        <Text style={styles.name}>{user?.username}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.statsContainer}>
        <StatItem value={userStats.posts} label="Posts" />
        <StatItem value={userStats.followers} label="Followers" />
        <StatItem value={userStats.following} label="Following" />
      </View>

      <TouchableOpacity style={styles.uploadsButton} onPress={() => {
        let rootNav = navigation;
        while (rootNav.getParent()) {
          rootNav = rootNav.getParent();
        }
        rootNav.navigate('MyUploads');
      }}>
        <Ionicons name="albums-outline" size={18} color="#fff" style={styles.uploadsButtonIcon} />
        <Text style={styles.uploadsButtonText}>Bài hát của tôi</Text>
      </TouchableOpacity>

      <View style={styles.postGrid}>
        {userPosts.map(post => (
          <TouchableOpacity key={post.id} style={styles.postItem}>
            <Image source={{ uri: post.cover }} style={styles.postImage} />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={[styles.logoutButton, logoutLoading && styles.logoutButtonDisabled]} onPress={handleLogout} disabled={logoutLoading}>
        {logoutLoading ? (
          <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
        ) : (
          <Ionicons name="log-out-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
        )}
        <Text style={styles.logoutButtonText}>{logoutLoading ? 'Đang đăng xuất...' : 'Đăng xuất'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.backgroundAlt,
    position: 'relative',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.foreground,
    flex: 1,
    textAlign: 'center',
  },
  logoutTextButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: COLORS.accentPurple + '15',
  },
  logoutActionText: {
    color: COLORS.accentPurple,
    fontWeight: '700',
    fontSize: 13,
  },
  profileInfo: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: COLORS.accentPurple,
  },
  name: { fontSize: 22, fontWeight: 'bold', color: COLORS.foreground, marginTop: 16 },
  email: { fontSize: 14, color: COLORS.foregroundSecondary, marginTop: 4 },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  statItem: { alignItems: 'center' },
  statValue: { color: COLORS.foreground, fontSize: 18, fontWeight: 'bold' },
  statLabel: { color: COLORS.foregroundSecondary, fontSize: 12, marginTop: 4 },
  postGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  postItem: {
    width: '33.333%',
    aspectRatio: 1,
    padding: 1,
  },
  postImage: {
    flex: 1,
    backgroundColor: COLORS.card,
  },
  uploadsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accentPurple,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
  },
  uploadsButtonIcon: {
    marginRight: 8,
  },
  uploadsButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
