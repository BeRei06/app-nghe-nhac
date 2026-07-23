import React, { useState } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../utils/theme';
import { useAuth } from '../store/AuthContext';

// Theme toggle — sẽ kết nối với ThemeContext khi implement dark/light mode đầy đủ
const THEME_OPTIONS = ['Dark', 'Light', 'Auto'];

export default function SettingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [selectedTheme, setSelectedTheme] = useState('Dark'); // Mặc định Dark theo spec

  const [logoutLoading, setLogoutLoading] = useState(false);

  const isAdmin = Boolean(
    user?.role === 'admin' ||
    user?.Roles?.some((role) => role.name === 'admin' || role.name === 'super_admin')
  );

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          setLogoutLoading(true);
          const success = await logout();
          setLogoutLoading(false);
          Alert.alert(
            'Đăng xuất',
            success ? 'Bạn đã đăng xuất thành công.' : 'Có lỗi khi đăng xuất. Dữ liệu cục bộ vẫn đã được xóa.'
          );
        },
      },
    ]);
  };

  const handleClearCache = () => {
    Alert.alert(
      'Dọn dẹp Cache',
      'Sẽ xóa ảnh tạm và dữ liệu cache. File nhạc offline sẽ được giữ lại.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Dọn dẹp',
          style: 'destructive',
          onPress: () => Alert.alert('Thành công', 'Cache đã được dọn dẹp.'),
        },
      ]
    );
  };

  const SettingRow = ({ icon, label, rightEl, onPress }) => (
    <TouchableOpacity style={styles.row} onPress={onPress} disabled={!onPress}>
      <View style={styles.rowLeft}>
        <View style={styles.iconBox}>
          <Ionicons name={icon} size={18} color={COLORS.accentPurple} />
        </View>
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      {rightEl ?? <Ionicons name="chevron-forward" size={16} color={COLORS.foregroundSecondary} />}
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
    >
      {/* Theme Settings — spec yêu cầu toggle Dark/Light/Auto */}
      <Text style={styles.sectionLabel}>GIAO DIỆN</Text>
      <View style={styles.card}>
        <Text style={styles.themeTitle}>Chế độ màu</Text>
        <View style={styles.themeRow}>
          {THEME_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.themeBtn, selectedTheme === option && styles.themeBtnActive]}
              onPress={() => setSelectedTheme(option)}
            >
              <Text style={[styles.themeBtnText, selectedTheme === option && styles.themeBtnTextActive]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Quản lý bộ nhớ */}
      <Text style={styles.sectionLabel}>BỘ NHỚ & DỮ LIỆU</Text>
      <View style={styles.card}>
        <View style={styles.storageInfo}>
          <View style={styles.storageBar}>
            <View style={[styles.storageUsed, { width: '45%', backgroundColor: COLORS.accentPurple }]} />
            <View style={[styles.storageUsed, { width: '20%', backgroundColor: COLORS.accentBlue }]} />
          </View>
          <View style={styles.storageLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.accentPurple }]} />
              <Text style={styles.legendText}>Nhạc offline (.enc): ~230 MB</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.accentBlue }]} />
              <Text style={styles.legendText}>Cache hình ảnh: ~80 MB</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.cleanBtn} onPress={handleClearCache}>
          <Ionicons name="trash-outline" size={16} color={COLORS.accentPurple} />
          <Text style={styles.cleanBtnText}>Dọn dẹp Cache</Text>
        </TouchableOpacity>
      </View>

      {/* Tài khoản */}
      <Text style={styles.sectionLabel}>TÀI KHOẢN</Text>
      <View style={styles.card}>
        <SettingRow
          icon="person-outline"
          label={user?.name || 'Chỉnh sửa hồ sơ'}
          onPress={() => navigation.navigate('Profile')}
        />
        <View style={styles.divider} />
        <SettingRow
          icon="shield-checkmark-outline"
          label="Chính sách quyền riêng tư"
        />
        <View style={styles.divider} />
        <SettingRow
          icon="document-text-outline"
          label="Điều khoản sử dụng"
        />
        {isAdmin && (
          <>
            <View style={styles.divider} />
            <SettingRow
              icon="mail-outline"
              label="Cấu hình mail SMTP"
              onPress={() => navigation.navigate('AdminMailConfig')}
            />
          </>
        )}
      </View>

      {/* Đăng xuất */}
      <TouchableOpacity style={[styles.logoutBtn, logoutLoading && styles.logoutBtnDisabled]} onPress={handleLogout} disabled={logoutLoading}>
        {logoutLoading ? (
          <ActivityIndicator size="small" color="#FF4D4F" style={{ marginRight: 8 }} />
        ) : (
          <Ionicons name="log-out-outline" size={20} color="#FF4D4F" style={{ marginRight: 8 }} />
        )}
        <Text style={styles.logoutText}>{logoutLoading ? 'Đang đăng xuất...' : 'Đăng xuất'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.foregroundSecondary,
    letterSpacing: 1,
    marginTop: 24,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: COLORS.bgSurface,
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  // Theme toggle
  themeTitle: { fontSize: 14, color: COLORS.foreground, marginBottom: 12, fontWeight: '500' },
  themeRow: { flexDirection: 'row', gap: 8 },
  themeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: COLORS.backgroundAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  themeBtnActive: {
    backgroundColor: COLORS.accentPurple + '25',
    borderColor: COLORS.accentPurple,
  },
  themeBtnText: { fontSize: 13, color: COLORS.foregroundSecondary, fontWeight: '500' },
  themeBtnTextActive: { color: COLORS.accentPurple, fontWeight: '700' },
  // Storage
  storageBar: {
    flexDirection: 'row',
    height: 6,
    backgroundColor: COLORS.backgroundAlt,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  storageUsed: { height: '100%' },
  storageLegend: { gap: 6, marginBottom: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, color: COLORS.foregroundSecondary },
  cleanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.accentPurple + '50',
  },
  cleanBtnText: { color: COLORS.accentPurple, fontWeight: '600', fontSize: 14 },
  // Setting rows
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.accentPurple + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowLabel: { fontSize: 14, color: COLORS.foreground },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 2 },
  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    margin: 16,
    marginTop: 24,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF4D4F40',
    backgroundColor: '#FF4D4F10',
  },
  logoutText: { color: '#FF4D4F', fontWeight: '600', fontSize: 15 },
});
