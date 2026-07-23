import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Image } from 'react-native';
import { useDevice } from '../store/DeviceContext';
import { getNotificationsApi } from '../api/notification.api';
import { COLORS } from '../utils/theme';
import { Ionicons } from '@expo/vector-icons';

const NotificationItem = ({ item }) => {
  const getIcon = () => {
    switch (item.type) {
      case 'like': return { name: 'heart', color: '#E53E3E' };
      case 'comment': return { name: 'chatbubble', color: COLORS.accentBlue };
      case 'follow': return { name: 'person-add', color: COLORS.accentPurple };
      default: return { name: 'notifications', color: COLORS.foregroundSecondary };
    }
  };

  const getText = () => {
    switch (item.type) {
      case 'like': return <Text style={styles.itemText}><Text style={styles.bold}>{item.user.name}</Text> liked your post.</Text>;
      case 'comment': return <Text style={styles.itemText}><Text style={styles.bold}>{item.user.name}</Text> commented on your post.</Text>;
      case 'follow': return <Text style={styles.itemText}><Text style={styles.bold}>{item.user.name}</Text> started following you.</Text>;
      default: return <Text style={styles.itemText}>You have a new notification.</Text>;
    }
  };

  const icon = getIcon();

  return (
    <TouchableOpacity style={[styles.itemContainer, !item.read && styles.itemUnread]}>
      <View style={[styles.iconContainer, { backgroundColor: icon.color }]}>
        <Ionicons name={icon.name} size={20} color={COLORS.foreground} />
      </View>
      <View style={styles.textContainer}>
        {getText()}
        <Text style={styles.timeText}>2 hours ago</Text>
      </View>
    </TouchableOpacity>
  );
};

export default function NotificationsScreen({ navigation }) {
  const { layout } = useDevice();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNotificationsApi()
      .then(res => setNotifications(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: layout.safeTop, height: layout.customHeaderH }]}>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>
      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} size="large" color={COLORS.accentPurple} />
      ) : (
        <FlatList
          data={notifications}
          renderItem={({ item }) => <NotificationItem item={item} />}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingBottom: layout.contentPaddingBottom }}
          ListEmptyComponent={<Text style={styles.emptyText}>No new notifications.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16, backgroundColor: COLORS.backgroundAlt, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.foreground },
  emptyText: { color: COLORS.foregroundSecondary, textAlign: 'center', marginTop: 50, fontSize: 16 },
  itemContainer: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  itemUnread: { backgroundColor: COLORS.backgroundAlt },
  iconContainer: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  textContainer: { flex: 1 },
  itemText: { color: COLORS.foreground, fontSize: 15 },
  bold: { fontWeight: 'bold' },
  timeText: { color: COLORS.foregroundSecondary, fontSize: 12, marginTop: 4 },
});