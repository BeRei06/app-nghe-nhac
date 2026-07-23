import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import Input from '../components/Input';
import Button from '../components/Button';
import { COLORS } from '../utils/theme';
import { useAuth } from '../store/AuthContext';

export default function ForgotPasswordScreen({ navigation }) {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError('Vui lòng nhập email.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      Alert.alert('Kiểm tra email', 'Nếu email tồn tại, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Lỗi', err.message || 'Không thể gửi yêu cầu. Vui lòng thử lại.');
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
        <Text style={styles.title}>Quên mật khẩu</Text>
        <Text style={styles.subtitle}>Nhập email để nhận liên kết đặt lại mật khẩu.</Text>

        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="example@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          error={error}
        />

        <Button title="Gửi yêu cầu" onPress={handleSubmit} loading={loading} style={styles.button} />
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
