import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/theme';

export default function Input({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  error,
  keyboardType,
  autoCapitalize = 'none',
}) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.wrapper}>
      {label && <Text style={[styles.label, { color: COLORS.foreground }]}>{label}</Text>}
      <View style={[styles.inputRow, error && styles.inputError]}>
        <TextInput
          style={[styles.input, { color: COLORS.foreground }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.foregroundSecondary}
          secureTextEntry={secureTextEntry && !visible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setVisible((v) => !v)} style={styles.eyeBtn} accessibilityLabel="Toggle password visibility">
            <Ionicons name={visible ? 'eye-off' : 'eye'} size={20} color={COLORS.foregroundSecondary} />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.02)',
    paddingHorizontal: 12,
    height: 54,
  },
  inputError: { borderColor: '#FF4D4F' },
  input: { flex: 1, fontSize: 15 },
  eyeBtn: { paddingLeft: 8, paddingRight: 6 },
  error: { color: '#FF4D4F', fontSize: 12, marginTop: 6 },
});
