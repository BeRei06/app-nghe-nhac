import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/theme';
import Input from '../components/Input';
import Button from '../components/Button';
import { getArtistSuggestionsApi, uploadSongApi } from '../api/upload.api';

export default function UploadStudioScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [songFile, setSongFile] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [form, setForm] = useState({ title: '', genre: '', artistInput: '' });
  const [loading, setLoading] = useState(false);
  const [artistSuggestions, setArtistSuggestions] = useState([]);
  const [selectedArtists, setSelectedArtists] = useState([]);

  const GENRE_OPTIONS = ['Pop', 'Rock', 'Indie', 'Hip-hop', 'Electronic', 'Jazz', 'Classical', 'R&B', 'Country', 'Folk'];
  const normalizeSuggestions = (res) => Array.isArray(res) ? res : res?.data || [];

  useEffect(() => {
    const q = form.artistInput.trim();
    if (!q) { setArtistSuggestions([]); return; }
    const timeout = setTimeout(async () => {
      try {
        const res = await getArtistSuggestionsApi(q);
        setArtistSuggestions(normalizeSuggestions(res));
      } catch {}
    }, 250);
    return () => clearTimeout(timeout);
  }, [form.artistInput]);

  const handleGenreSelect = (genre) => setForm((f) => ({ ...f, genre }));

  const handlePickSong = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      const file = result.assets?.[0] || result;
      if (!file || !file.uri || result.canceled === true) {
        return;
      }

      const fileName = file.name || file.uri?.split('/').pop() || 'selected-audio';
      const mimeType = file.mimeType || file.type || 'audio/mpeg';
      const size = file.size || null;
      const titleFromFile = fileName.replace(/\.[^/.]+$/, '').trim();

      setSongFile({
        uri: file.uri,
        name: fileName,
        type: mimeType,
        size,
      });
      setForm((f) => ({ ...f, title: f.title || titleFromFile }));
    } catch (err) {
      console.log('DocumentPicker error:', err);
      Alert.alert('Error', 'Could not pick the file.');
    }
  };

  const handlePickCover = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: true,
      });

      const file = result.assets?.[0] || result;
      if (!file || !file.uri || result.canceled === true) {
        return;
      }

      const fileName = file.name || file.uri?.split('/').pop() || 'cover.jpg';
      const mimeType = file.mimeType || file.type || 'image/jpeg';
      const size = file.size || null;

      if (size && size > 5 * 1024 * 1024) {
        Alert.alert('File Too Large', 'Cover image must be smaller than 5MB.');
        return;
      }

      setCoverImage({
        uri: file.uri,
        name: fileName,
        type: mimeType,
        size,
      });
    } catch (err) {
      console.log('DocumentPicker error:', err);
      Alert.alert('Error', 'Could not pick the cover image.');
    }
  };

  const handleUpload = async () => {
    if (!songFile || !form.title.trim()) {
      Alert.alert('Missing Information', 'Please select a song file and enter a title.');
      return;
    }

    if (!songFile.uri) {
      Alert.alert('Invalid File', 'Selected file must have a valid URI.');
      return;
    }

    const fileSizeMb = songFile.size ? songFile.size / 1024 / 1024 : null;
    if (fileSizeMb && fileSizeMb > 50) {
      Alert.alert('File Too Large', 'Audio file must be smaller than 50MB.');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('audio', {
        uri: songFile.uri,
        name: songFile.name || 'upload.mp3',
        type: songFile.mimeType || songFile.type || 'audio/mpeg',
      });
      if (coverImage) {
        formData.append('cover_image', {
          uri: coverImage.uri,
          name: coverImage.name || 'cover.jpg',
          type: coverImage.type || 'image/jpeg',
        });
      }
      formData.append('title', form.title.trim());
      if (selectedArtists.length) {
        formData.append('artists', JSON.stringify(selectedArtists.map((artist) => artist.name)));
      } else if (form.artistInput.trim()) {
        formData.append('artist_name', form.artistInput.trim());
      }
      if (form.genre.trim()) {
        formData.append('genre', form.genre.trim());
      }

      const response = await uploadSongApi(formData);
      const songId = response?.songId;
      Alert.alert('Upload Started', `Your audio is being processed.${songId ? ` Song ID: ${songId}` : ''}`);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Upload Failed', error.message || 'Unable to upload audio. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Text style={styles.headerTitle}>Upload Studio</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. Select Audio File</Text>
        <TouchableOpacity style={styles.filePicker} onPress={handlePickSong}>
          <Ionicons name="musical-notes-outline" size={24} color={COLORS.accentPurple} />
          <Text style={styles.filePickerText}>{songFile ? songFile.name : 'Tap to select a song'}</Text>
        </TouchableOpacity>
        {songFile && <Text style={styles.fileSizeText}>Size: {songFile.size ? (songFile.size / 1024 / 1024).toFixed(2) : 'N/A'} MB</Text>}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. Song Information</Text>
        <Input label="Song Title" placeholder="Enter song title" value={form.title} onChangeText={(val) => setForm(f => ({...f, title: val}))} />
        <Text style={styles.label}>Artists</Text>
        <TextInput
          placeholder="Type artist name..."
          value={form.artistInput}
          onChangeText={(val) => setForm(f => ({ ...f, artistInput: val }))}
          style={styles.input}
          placeholderTextColor={COLORS.foregroundSecondary}
        />
        {artistSuggestions.length > 0 && (
          <View style={styles.suggestionBox}>
            {artistSuggestions.map((artist) => (
              <TouchableOpacity key={artist.id} style={styles.suggestionItem} onPress={() => {
                if (!selectedArtists.some((x) => x.id === artist.id)) setSelectedArtists([...selectedArtists, artist]);
                setForm((f) => ({ ...f, artistInput: '' }));
                setArtistSuggestions([]);
              }}>
                <Text style={styles.suggestionText}>{artist.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {selectedArtists.length > 0 && (
          <View style={styles.selectedWrap}>
            {selectedArtists.map((artist) => (
              <TouchableOpacity key={artist.id} style={styles.selectedChip} onPress={() => setSelectedArtists(selectedArtists.filter((x) => x.id !== artist.id))}>
                <Text style={styles.selectedText}>{artist.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <Text style={styles.label}>Genre</Text>
        <View style={styles.genreList}>
          {GENRE_OPTIONS.map((genre) => (
            <TouchableOpacity
              key={genre}
              style={[styles.genreChip, form.genre === genre && styles.genreChipActive]}
              onPress={() => handleGenreSelect(genre)}
            >
              <Text style={[styles.genreText, form.genre === genre && styles.genreTextActive]}>{genre}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. Cover Image</Text>
        <TouchableOpacity style={styles.filePicker} onPress={handlePickCover}>
          <Ionicons name="image-outline" size={24} color={COLORS.accentPurple} />
          <Text style={styles.filePickerText}>{coverImage ? coverImage.name : 'Tap to select a cover image'}</Text>
        </TouchableOpacity>
        {coverImage ? (
          <Image source={{ uri: coverImage.uri }} style={styles.coverPreview} />
        ) : (
          <Text style={styles.helperText}>Optional, nhưng giúp bài hát của bạn nổi bật hơn.</Text>
        )}
      </View>

      <View style={styles.footer}>
        <Button title="Upload Song" onPress={handleUpload} loading={loading} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: 16, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle: { color: COLORS.foreground, fontSize: 20, fontWeight: 'bold' },
  section: { padding: 16, marginTop: 16 },
  sectionTitle: { color: COLORS.foreground, fontSize: 16, fontWeight: '600', marginBottom: 16 },
  filePicker: {
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundAlt,
  },
  filePickerText: { color: COLORS.foregroundSecondary, marginTop: 8 },
  fileSizeText: { color: COLORS.foregroundSecondary, fontSize: 12, marginTop: 8, textAlign: 'center' },
  label: { color: COLORS.foregroundSecondary, fontSize: 14, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.foreground,
    marginBottom: 8,
    backgroundColor: COLORS.backgroundAlt,
  },
  suggestionBox: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, overflow: 'hidden', marginBottom: 8 },
  suggestionItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  suggestionText: { color: COLORS.foreground },
  selectedWrap: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  selectedChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: COLORS.accentPurple, marginRight: 8, marginBottom: 8 },
  selectedText: { color: COLORS.background, fontSize: 12 },
  genreList: { flexDirection: 'row', flexWrap: 'wrap' },
  genreChip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.backgroundAlt,
    marginBottom: 8,
    marginRight: 8,
  },
  genreChipActive: {
    backgroundColor: COLORS.accentPurple,
    borderColor: COLORS.accentPurple,
  },
  genreText: { color: COLORS.foregroundSecondary },
  genreTextActive: { color: COLORS.background },
  coverPreview: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginTop: 12,
    backgroundColor: COLORS.backgroundAlt,
  },
  helperText: { color: COLORS.foregroundSecondary, fontSize: 12, marginTop: 8 },
  footer: { padding: 16, marginTop: 24 },
});