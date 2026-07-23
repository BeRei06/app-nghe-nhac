import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import Input from '../components/Input';
import Button from '../components/Button';
import { COLORS } from '../utils/theme';
import { useAuth } from '../store/AuthContext';
import { getMailConfigApi, updateMailConfigApi } from '../api/admin.api';

export default function AdminMailConfigScreen({ navigation }) {
  const { user } = useAuth();
  const [form, setForm] = useState({ host: '', port: '', secure: 'true', user: '', pass: '', fromEmail: '', fromName: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const setField = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await getMailConfigApi();
        const data = res.data.data;
        setForm({
          host: data.host || '',
          port: data.port?.toString() || '',
          secure: data.secure ? 'true' : 'false',
          user: data.user || '',
          pass: '',
          fromEmail: data.fromEmail || '',
          fromName: data.fromName || '',
        });
      } catch (err) {
        Alert.alert('Lỗi', err.message || 'Không thể tải cấu hình mail.');
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  const handleSave = async () => {
    if (!form.host || !form.port || !form.user || !form.pass || !form.fromEmail || !form.fromName) {
      Alert.alert('Thiếu thông tin', 'Vui lòng điền đầy đủ các trường bắt buộc.');
      return;
    }

    setSaving(true);
    try {
      await updateMailConfigApi({
        authType: 'smtp',
        host: form.host,
        port: Number(form.port),
        secure: form.secure === 'true',
        user: form.user,
        pass: form.pass,
        fromEmail: form.fromEmail,
        fromName: form.fromName,
      });

      Alert.alert('Thành công', 'Cấu hình mail đã được lưu.');
    } catch (err) {
      Alert.alert('Lỗi', err.message || 'Không thể lưu cấu hình mail.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Cấu hình Email</Text>
      <Text style={styles.description}>Chỉ admin mới có thể xem và cập nhật cấu hình SMTP để gửi email xác thực và thông báo.</Text>

      <Input label="SMTP Host" value={form.host} onChangeText={setField('host')} placeholder="smtp.example.com" error={null} />
      <Input label="SMTP Port" value={form.port} onChangeText={setField('port')} placeholder="465" keyboardType="numeric" error={null} />
      <Input label="Use TLS/SSL" value={form.secure} onChangeText={setField('secure')} placeholder="true/false" error={null} />
      <Input label="SMTP Username" value={form.user} onChangeText={setField('user')} placeholder="your_email@example.com" error={null} />
      <Input label="SMTP Password" value={form.pass} onChangeText={setField('pass')} placeholder="******" secureTextEntry error={null} />
      <Input label="From Email" value={form.fromEmail} onChangeText={setField('fromEmail')} placeholder="no-reply@example.com" error={null} />
      <Input label="From Name" value={form.fromName} onChangeText={setField('fromName')} placeholder="LT Web" error={null} />

      <Button title={saving ? 'Đang lưu...' : 'Lưu cấu hình'} onPress={handleSave} loading={saving} style={styles.button} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 24 },
  title: { fontSize: 26, fontWeight: '700', color: COLORS.foreground, marginBottom: 8 },
  description: { color: COLORS.foregroundSecondary, marginBottom: 24, lineHeight: 20 },
  button: { marginTop: 20 },
});
