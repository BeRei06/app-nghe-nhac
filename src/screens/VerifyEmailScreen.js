import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import Input from '../components/Input';
import Button from '../components/Button';
import { COLORS } from '../utils/theme';
import { useAuth } from '../store/AuthContext';

export default function VerifyEmailScreen({ navigation, route }) {
  const { verifyEmail, resendVerificationEmail } = useAuth();
  const initialEmail = route?.params?.email || '';
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const handleVerify = async () => {
    if (!email.trim() || !code.trim()) {
      setError('Vui lòng nhập email và mã xác thực.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await verifyEmail(email.trim(), code.trim());
      Alert.alert('Xác thực thành công', 'Email của bạn đã được xác nhận. Vui lòng đăng nhập.');
      navigation.navigate('Login');
    } catch (err) {
      setError(err.message || 'Không thể xác thực email. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) {
      setError('Vui lòng nhập email để nhận lại mã xác thực.');
      return;
    }
    setError('');
    setSending(true);
    try {
      await resendVerificationEmail(email.trim());
      Alert.alert('Đã gửi lại mã', 'Vui lòng kiểm tra email để nhận mã xác thực mới.');
    } catch (err) {
      setError(err.message || 'Không thể gửi lại mã xác thực. Vui lòng thử lại.');
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Xác thực email</Text>
        <Text style={styles.subtitle}>Nhập email và mã xác thực bạn nhận được từ hộp thư.</Text>

        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="example@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          error={error}
        />
        <Input
          label="Mã xác thực"
          value={code}
          onChangeText={setCode}
          placeholder="123456"
          keyboardType="numeric"
          autoCapitalize="none"
          error={error}
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Button title="Xác nhận email" onPress={handleVerify} loading={loading} style={styles.button} />
        <Button title="Gửi lại mã xác thực" onPress={handleResend} loading={sending} type="secondary" style={styles.resendButton} />
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
  resendButton: { marginTop: 12 },
  errorText: { color: '#FF4D4F', marginTop: 8, fontSize: 13, lineHeight: 18 },
});
