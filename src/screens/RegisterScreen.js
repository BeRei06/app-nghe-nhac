import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../store/AuthContext';
import Input from '../components/Input';
import Button from '../components/Button';
import { COLORS } from '../utils/theme';

// Trong ứng dụng thực tế, ID này nên được lấy từ API, ví dụ: /api/legal/latest?type=terms_of_use
// Để phục vụ việc sửa lỗi, chúng ta tạm hardcode là 1.
const LATEST_TOS_DOCUMENT_ID = 1;

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [agreedToS, setAgreedToS] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  const validate = () => {
    const e = {};
    if (!form.username.trim()) e.username = 'Vui lòng nhập tên người dùng.';
    if (!form.email) e.email = 'Vui lòng nhập email.';
    if (form.password.length < 6) e.password = 'Mật khẩu tối thiểu 6 ký tự.';
    if (form.password !== form.confirm) e.confirm = 'Mật khẩu xác nhận không khớp.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    if (!agreedToS) {
      Alert.alert('Điều khoản dịch vụ', 'Bạn phải đồng ý với Điều khoản dịch vụ để tiếp tục.');
      return;
    }
    setApiError('');
    setLoading(true);
    try {
      const result = await register({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        document_id: LATEST_TOS_DOCUMENT_ID,
      });

      if (!result?.success) {
        setApiError(result?.error || 'Đăng ký thất bại. Vui lòng thử lại.');
        return;
      }

      Alert.alert('Đăng ký thành công', 'Tài khoản của bạn đã được tạo. Vui lòng kiểm tra email để xác nhận tài khoản.');
      navigation.navigate('VerifyEmail', { email: form.email.trim() });
    } catch (err) {
      setApiError(err.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <View style={styles.logoRow}>
          <View style={styles.logoCircle}>
            <Ionicons name="musical-notes" size={32} color="#fff" />
          </View>
        </View>

        {/* Segmented toggle */}
        <View style={styles.segmentRow}>
          <TouchableOpacity style={[styles.segment, styles.segmentLeft]} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.segmentText}>Đăng nhập</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.segment, styles.segmentRight, styles.segmentActive]} onPress={() => {}}>
            <Text style={styles.segmentTextActive}>Đăng ký</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Tạo tài khoản</Text>
        <Text style={styles.subtitle}>Tham gia cộng đồng âm nhạc ngay hôm nay</Text>

        <Input label="Tên người dùng" value={form.username} onChangeText={set('username')} placeholder="nguyenvana" error={errors.username} autoCapitalize="none" />
        <Input label="Email" value={form.email} onChangeText={set('email')} placeholder="example@email.com" keyboardType="email-address" autoCapitalize="none" error={errors.email} />
        <Input label="Mật khẩu" value={form.password} onChangeText={set('password')} placeholder="Tối thiểu 6 ký tự" secureTextEntry error={errors.password} />
        <Input label="Xác nhận mật khẩu" value={form.confirm} onChangeText={set('confirm')} placeholder="Nhập lại mật khẩu" secureTextEntry error={errors.confirm} />

        {apiError ? <Text style={styles.errorText}>{apiError}</Text> : null}

        <TouchableOpacity style={styles.tosRow} onPress={() => setAgreedToS(!agreedToS)} activeOpacity={0.7}>
          <View style={[styles.checkbox, agreedToS && styles.checkboxChecked]}>
            {agreedToS && <Ionicons name="checkmark" size={14} color="#fff" />}
          </View>
          <Text style={styles.tosText}>
            Tôi đồng ý với{' '}
            <Text style={styles.linkBold} onPress={() => { /* Navigate to ToS screen */ }}>Điều khoản dịch vụ</Text> và{' '}
            <Text style={styles.linkBold} onPress={() => { /* Navigate to Privacy Policy screen */ }}>Chính sách bảo mật</Text>.
          </Text>
        </TouchableOpacity>

        <Button title="Tiếp tục" onPress={handleRegister} loading={loading} style={[styles.btn, styles.primaryBtn]} />

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>
            Đã có tài khoản? <Text style={styles.linkBold}>Đăng nhập</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: COLORS.background,
  },
  logoRow: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.accentPurple,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.accentPurple,
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.foreground, marginBottom: 6 },
  subtitle: { fontSize: 15, color: COLORS.foregroundSecondary, marginBottom: 32 },
  btn: { marginTop: 8, marginBottom: 20 },
  errorText: {
    color: '#FF4D4F',
    marginBottom: 12,
    fontSize: 13,
    lineHeight: 18,
  },
  link: { textAlign: 'center', color: COLORS.foregroundSecondary, fontSize: 14 },
  linkBold: { color: COLORS.accentPurple, fontWeight: '600' },
  tosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: COLORS.foregroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: COLORS.accentPurple,
    borderColor: COLORS.accentPurple,
  },
  tosText: {
    flex: 1, color: COLORS.foregroundSecondary, fontSize: 13, lineHeight: 18
  },
  segmentRow: {
    flexDirection: 'row',
    alignSelf: 'center',
    marginBottom: 18,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 40,
    padding: 4,
  },
  segment: {
    paddingVertical: 8,
    paddingHorizontal: 22,
    borderRadius: 36,
  },
  segmentLeft: { marginRight: 6 },
  segmentRight: { marginLeft: 6 },
  segmentActive: { backgroundColor: COLORS.accentPurple },
  segmentText: { color: COLORS.foregroundSecondary, fontWeight: '700' },
  segmentTextActive: { color: '#fff', fontWeight: '800' },
  primaryBtn: {
    backgroundColor: COLORS.accentPurple,
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
  },
});
