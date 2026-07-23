import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, ImageBackground, TouchableOpacity } from 'react-native';
import { useDevice } from '../store/DeviceContext';
import { getGroupsApi } from '../api/group.api';
import { COLORS } from '../utils/theme';

// GroupCard component inside the screen for simplicity
const GroupCard = ({ item, onPress }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
    <ImageBackground source={{ uri: item.cover }} style={styles.card} imageStyle={{ borderRadius: 12 }}>
      <View style={styles.cardOverlay}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardMembers}>{item.members.toLocaleString()} members</Text>
      </View>
    </ImageBackground>
  </TouchableOpacity>
);

export default function GroupsScreen({ navigation }) {
  const { layout } = useDevice();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getGroupsApi()
      .then(res => setGroups(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: layout.safeTop, height: layout.customHeaderH }]}>
        <Text style={styles.headerTitle}>Groups</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} size="large" color={COLORS.accentPurple} />
      ) : (
        <FlatList
          data={groups}
          renderItem={({ item }) => <GroupCard item={item} onPress={() => { /* Navigate to GroupDetail later */ }} />}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16, paddingBottom: layout.contentPaddingBottom }}
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
  card: {
    height: 120,
    borderRadius: 12,
    marginBottom: 16,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  cardOverlay: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 12,
  },
  cardTitle: {
    color: COLORS.foreground,
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardMembers: {
    color: COLORS.foregroundSecondary,
    fontSize: 13,
    marginTop: 2,
  },
});