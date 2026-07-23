import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { useAuth } from '../store/AuthContext';
import Input from '../components/Input';
import Button from '../components/Button';
import { COLORS } from '../utils/theme';

// Bắt buộc gọi để hoàn tất OAuth redirect trên Android/Web
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ navigation }) {
  const { login, loginWithGoogle, loginWithApple } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  // Đọc client ID từ app.json extra (cấu hình ở app.json)
  const extra = Constants.expoConfig?.extra ?? {};

  const [googleRequest, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    webClientId: extra.googleWebClientId,
    iosClientId: extra.googleIosClientId,
    androidClientId: extra.googleAndroidClientId,
  });

  // Xử lý kết quả Google OAuth
  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const accessToken = googleResponse.authentication?.accessToken;
      if (accessToken) {
        handleGoogleCallback(accessToken);
      }
    } else if (googleResponse?.type === 'error') {
      setGoogleLoading(false);
      Alert.alert('Google Sign-In thất bại', googleResponse.error?.message ?? 'Vui lòng thử lại.');
    } else if (googleResponse?.type === 'cancel' || googleResponse?.type === 'dismiss') {
      setGoogleLoading(false);
    }
  }, [googleResponse]);

  const handleGoogleCallback = async (accessToken) => {
    try {
      await loginWithGoogle(accessToken);
    } catch (err) {
      Alert.alert('Đăng nhập Google thất bại', err.message);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!extra.googleWebClientId || extra.googleWebClientId.startsWith('YOUR_')) {
      Alert.alert('Chưa cấu hình', 'Google Client ID chưa được thiết lập trong app.json.');
      return;
    }
    setGoogleLoading(true);
    await googlePromptAsync();
    // setGoogleLoading(false) sẽ được gọi trong useEffect khi có response
  };

  const handleAppleLogin = async () => {
    setAppleLoading(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      await loginWithApple(credential.identityToken, credential.user);
    } catch (err) {
      if (err.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Apple Sign-In thất bại', err.message);
      }
    } finally {
      setAppleLoading(false);
    }
  };

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Vui lòng nhập email.';
    if (!form.password) e.password = 'Vui lòng nhập mật khẩu.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setApiError('');
    setLoading(true);
    const result = await login(form.email.trim(), form.password);
    setLoading(false);

    if (result?.success !== true) {
      setApiError(result?.error || 'Đăng nhập thất bại. Vui lòng thử lại.');
      return;
    }

    Alert.alert('Đăng nhập thành công', 'Chào mừng bạn trở lại!');
    // AppNavigator sẽ tự động chuyển sang TastePicker hoặc AppRoot dựa trên auth state.
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
          <TouchableOpacity style={[styles.segment, styles.segmentLeft, styles.segmentActive]} onPress={() => {}}>
            <Text style={[styles.segmentTextActive]}>Đăng nhập</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.segment, styles.segmentRight]} onPress={() => navigation.navigate('Register')}>
            <Text style={styles.segmentText}>Đăng ký</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Chào mừng trở lại</Text>
        <Text style={styles.subtitle}>Đăng nhập để tiếp tục</Text>

        {/* Email / Password form */}
        <Input
          label="Email"
          value={form.email}
          onChangeText={set('email')}
          placeholder="example@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.email}
        />
        <Input
          label="Mật khẩu"
          value={form.password}
          onChangeText={set('password')}
          placeholder="Nhập mật khẩu"
          secureTextEntry
          error={errors.password}
        />

        {apiError ? <Text style={styles.errorText}>{apiError}</Text> : null}

        <Button title="Tiếp tục" onPress={handleLogin} loading={loading} style={[styles.btn, styles.primaryBtn]} />

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>hoặc đăng nhập bằng</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Google Sign-In */}
        <TouchableOpacity
          style={[styles.socialBtn, styles.googleBtn]}
          onPress={handleGoogleLogin}
          disabled={googleLoading || !googleRequest}
          activeOpacity={0.8}
        >
          <View style={styles.googleIcon}>
            <Text style={styles.googleIconText}>G</Text>
          </View>
          <Text style={styles.googleBtnText}>
            {googleLoading ? 'Đang kết nối...' : 'Tiếp tục với Google'}
          </Text>
        </TouchableOpacity>

        {/* Apple Sign-In — chỉ hiện trên iOS */}
        {Platform.OS === 'ios' && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={12}
            style={styles.appleBtn}
            onPress={handleAppleLogin}
          />
        )}

        {/* Đăng ký */}
        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={{ marginTop: 8, alignSelf: 'flex-start' }}>
          <Text style={styles.link}>Quên mật khẩu?</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('VerifyEmail')} style={{ marginTop: 8, alignSelf: 'flex-start' }}>
          <Text style={styles.link}>Chưa nhận mã xác thực? Xác thực email</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')} style={{ marginTop: 12 }}>
          <Text style={styles.link}>
            Chưa có tài khoản? <Text style={styles.linkBold}>Đăng ký ngay</Text>
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.foreground,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.foregroundSecondary,
    marginBottom: 32,
  },
  btn: { marginTop: 8, marginBottom: 4 },
  errorText: {
    color: '#FF4D4F',
    marginBottom: 12,
    fontSize: 13,
    lineHeight: 18,
  },
  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    fontSize: 12,
    color: COLORS.foregroundSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Google button
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  googleIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleIconText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  googleBtnText: {
    color: '#1F1F1F',
    fontSize: 15,
    fontWeight: '600',
  },
  // Apple button (native component — style chỉ nhận width/height)
  appleBtn: {
    width: '100%',
    height: 50,
    marginBottom: 12,
  },
  link: { textAlign: 'center', color: COLORS.foregroundSecondary, fontSize: 14 },
  linkBold: { color: COLORS.accentPurple, fontWeight: '600' },
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
