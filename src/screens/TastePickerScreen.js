import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../utils/theme';
import Button from '../components/Button';
import { useAuth } from '../store/AuthContext';
import { saveTags } from '../utils/storage';

const TASTE_TAGS = [
  'Pop', 'Rock', 'Indie', 'Hip-Hop', 'Electronic', 'R&B',
  'Jazz', 'Classical', 'Country', 'Folk', 'Metal', 'Blues',
  'Chill', 'Workout', 'Sad Vibes', 'Focus', 'Party', '90s Rock'
];

export default function TastePickerScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { updateUser } = useAuth();
  const [selectedTags, setSelectedTags] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleContinue = async () => {
    if (selectedTags.length < 3) {
      Alert.alert('Select at least 3', 'Please select at least 3 genres to continue.');
      return;
    }
    setIsLoading(true);
    try {
      await saveTags(selectedTags);
      // Cap nhat tasteTags trong AuthContext -> AppNavigator se tu dong chuyen
      // sang nhanh AppRoot (khong can tu goi navigate/reset o day).
      await updateUser({ tasteTags: selectedTags });
    } catch (error) {
      Alert.alert('Error', 'Could not save your preferences. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>What do you like?</Text>
      <Text style={styles.subtitle}>Select at least 3 genres. This will help us recommend music for you.</Text>
      
      <ScrollView contentContainerStyle={styles.grid}>
        {TASTE_TAGS.map(tag => {
          const isSelected = selectedTags.includes(tag);
          return (
            <TouchableOpacity
              key={tag}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => toggleTag(tag)}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{tag}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Button
          title={`Continue (${selectedTags.length})`}
          onPress={handleContinue}
          loading={isLoading}
          // Assuming your Button component can be disabled
          // disabled={selectedTags.length < 3 || isLoading}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.foreground,
    marginTop: 24,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.foregroundSecondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 },
  chip: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
  chipSelected: { backgroundColor: COLORS.accentPurple, borderColor: COLORS.accentPurple },
  chipText: { color: COLORS.foreground, fontSize: 16, fontWeight: '500' },
  chipTextSelected: { color: COLORS.foreground },
  footer: { paddingTop: 16, borderTopWidth: 1, borderTopColor: COLORS.border },
});