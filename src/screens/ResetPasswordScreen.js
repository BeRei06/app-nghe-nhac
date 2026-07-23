import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import Input from '../components/Input';
import Button from '../components/Button';
import { COLORS } from '../utils/theme';
import { useAuth } from '../store/AuthContext';

export default function ResetPasswordScreen({ route, navigation }) {
  const { resetPassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const token = route.params?.token || '';

  const handleSubmit = async () => {
    if (!password || !confirmPassword) {
      setError('Vui lòng nhập đầy đủ mật khẩu.');
      return;
    }
    if (password.length < 6) {
      setError('Mật khẩu tối thiểu 6 ký tự.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    if (!token) {
      setError('Token đặt lại mật khẩu không tồn tại.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await resetPassword(token, password);
      Alert.alert('Thành công', 'Mật khẩu của bạn đã được đặt lại. Vui lòng đăng nhập lại.');
      navigation.navigate('Login');
    } catch (err) {
      Alert.alert('Lỗi', err.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Đặt lại mật khẩu</Text>
        <Text style={styles.subtitle}>Nhập mật khẩu mới để bạn có thể truy cập lại tài khoản.</Text>

        <Input
          label="Mật khẩu mới"
          value={password}
          onChangeText={setPassword}
          placeholder="Tối thiểu 6 ký tự"
          secureTextEntry
          error={error}
        />
        <Input
          label="Xác nhận mật khẩu"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Nhập lại mật khẩu"
          secureTextEntry
          error={error}
        />

        <Button title="Đặt lại mật khẩu" onPress={handleSubmit} loading={loading} style={styles.button} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.foreground, marginBottom: 8 },
  subtitle: { fontSize: 15, color: COLORS.foregroundSecondary, marginBottom: 24, lineHeight: 22 },
  button: { marginTop: 16 },
});
