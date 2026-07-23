import React, { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TextInput, ScrollView, Alert, TouchableOpacity, ActivityIndicator, PanResponder } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { COLORS } from '../utils/theme';
import { API_BASE_URL } from '../utils/env';
import Button from '../components/Button';
import { createPostApi } from '../api/feed.api';

const MIN_SNIPPET_DURATION = 5;
const MAX_SNIPPET_DURATION = 60;

export default function SnippetCreatorScreen({ route, navigation }) {
  const { song } = route.params;
  const insets = useSafeAreaInsets();

  const effectiveDuration = Math.max(1, song.duration ?? MAX_SNIPPET_DURATION);
  const maxSnippetLength = Math.min(MAX_SNIPPET_DURATION, effectiveDuration);

  const [caption, setCaption] = useState('');
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(Math.min(maxSnippetLength, effectiveDuration));
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playLoading, setPlayLoading] = useState(false);
  const [timelineWidth, setTimelineWidth] = useState(0);
  const [activeHandle, setActiveHandle] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const soundRef = useRef(null);
  const startTimeRef = useRef(startTime);
  const endTimeRef = useRef(endTime);
  const timelineWidthRef = useRef(0);
  const dragContextRef = useRef({ originStartTime: 0, originEndTime: 0 });
  const snippetEndMillisRef = useRef(null);

  useEffect(() => {
    startTimeRef.current = startTime;
  }, [startTime]);

  useEffect(() => {
    endTimeRef.current = endTime;
  }, [endTime]);

  const clamp = useCallback((value, min, max) => Math.min(Math.max(value, min), max), []);

  const selectedWidth = useMemo(() => ((endTime - startTime) / effectiveDuration) * 100, [startTime, endTime, effectiveDuration]);
  const selectedLeft = useMemo(() => (startTime / effectiveDuration) * 100, [startTime, effectiveDuration]);
  const selectedDuration = useMemo(() => Math.max(0, endTime - startTime), [startTime, endTime]);
  const selectionOverlayColor = isDragging ? COLORS.accentPurple + '35' : COLORS.accentPurple + '18';

  const waveformBars = useMemo(() => {
    const count = 56;
    return Array.from({ length: count }, (_, index) => {
      const progress = index / (count - 1);
      const base = 0.38 + Math.sin(progress * Math.PI * 4) * 0.27;
      const variance = Math.cos(progress * Math.PI * 10) * 0.14;
      return clamp(base + variance, 0.18, 1);
    });
  }, [clamp]);

  const handleTimelineLayout = (event) => {
    const width = event.nativeEvent.layout.width;
    setTimelineWidth(width);
    timelineWidthRef.current = width;
  };

  const ensureAudioMode = useCallback(async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    } catch (error) {
      console.warn('[SnippetCreator] setAudioModeAsync error', error);
    }
  }, []);

  const getAudioUri = () => {
    const uri = song?.hls_url || song?.hls_streaming_url || song?.audio_url || song?.stream_url || song?.url || null;
    if (!uri && song?.id) {
      console.warn('[SnippetCreator] No audio source available for song', song.id, song);
    }
    return uri;
  };

  const normalizeEncodedUrl = (url) => {
    if (!url) return url;
    let normalized = url;
    if (normalized.includes('%2520')) {
      normalized = normalized.replace(/%2520/g, '%20');
    }
    if (normalized.includes('%25')) {
      try {
        normalized = decodeURI(normalized);
      } catch (err) {
        console.warn('[SnippetCreator] normalizeEncodedUrl decodeURI failed', normalized, err);
      }
    }
    return normalized;
  };

  const resolveAudioUri = (uri) => {
    if (!uri) return null;
    let resolved = uri;
    if (!/^https?:\/\//i.test(resolved)) {
      const apiRoot = API_BASE_URL.replace(/\/api\/?$/, '');
      resolved = resolved.startsWith('/') ? `${apiRoot}${resolved}` : `${apiRoot}/${resolved}`;
    }
    return normalizeEncodedUrl(resolved);
  };

  const unloadSound = async () => {
    if (soundRef.current) {
      try {
        soundRef.current.setOnPlaybackStatusUpdate(null);
        await soundRef.current.stopAsync().catch(() => {});
        await soundRef.current.unloadAsync();
      } catch (_) {}
      soundRef.current = null;
      snippetEndMillisRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      unloadSound();
    };
  }, []);

  const handleDragGrant = (handle) => {
    setIsDragging(true);
    setActiveHandle(handle);
    dragContextRef.current = {
      originStartTime: startTimeRef.current,
      originEndTime: endTimeRef.current,
    };
  };

  const handleDragRelease = () => {
    setIsDragging(false);
    setActiveHandle(null);
  };

  const makeResponder = (handleType) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => handleDragGrant(handleType),
      onPanResponderMove: (_, gestureState) => {
        if (!timelineWidthRef.current) return;
        const deltaSeconds = (gestureState.dx / timelineWidthRef.current) * effectiveDuration;

        if (handleType === 'start') {
          const newStart = clamp(
            dragContextRef.current.originStartTime + deltaSeconds,
            0,
            dragContextRef.current.originEndTime - MIN_SNIPPET_DURATION
          );
          setStartTime(newStart);
          return;
        }

        if (handleType === 'end') {
          const newEnd = clamp(
            dragContextRef.current.originEndTime + deltaSeconds,
            dragContextRef.current.originStartTime + MIN_SNIPPET_DURATION,
            effectiveDuration
          );
          setEndTime(newEnd);
          return;
        }

        const segmentLength = dragContextRef.current.originEndTime - dragContextRef.current.originStartTime;
        const newStart = clamp(
          dragContextRef.current.originStartTime + deltaSeconds,
          0,
          effectiveDuration - segmentLength
        );
        setStartTime(newStart);
        setEndTime(newStart + segmentLength);
      },
      onPanResponderRelease: handleDragRelease,
      onPanResponderTerminate: handleDragRelease,
    });

  const startHandleResponder = useMemo(() => makeResponder('start'), []);
  const endHandleResponder = useMemo(() => makeResponder('end'), []);
  const selectionResponder = useMemo(() => makeResponder('range'), []);

  const playSnippet = async () => {
    const audioUri = resolveAudioUri(getAudioUri());
    if (!audioUri) {
      Alert.alert('Audio preview not available', 'Không tìm thấy đường dẫn audio để phát thử.');
      return;
    }

    setPlayLoading(true);
    await unloadSound();
    await ensureAudioMode();

    try {
      const startMillis = Math.round(startTimeRef.current * 1000);
      const durationMillis = Math.round((endTimeRef.current - startTimeRef.current) * 1000);
      snippetEndMillisRef.current = startMillis + durationMillis;

      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true, positionMillis: startMillis, progressUpdateIntervalMillis: 100 },
        (status) => {
          if (!status.isLoaded) return;
          if (snippetEndMillisRef.current !== null && status.positionMillis >= snippetEndMillisRef.current) {
            sound.pauseAsync().catch(() => {});
            setIsPlaying(false);
            snippetEndMillisRef.current = null;
          }
          if (status.didJustFinish) {
            setIsPlaying(false);
            snippetEndMillisRef.current = null;
          }
        }
      );

      soundRef.current = sound;
      setIsPlaying(true);
    } catch (error) {
      console.warn('[SnippetCreator] playSnippet error', error);
      Alert.alert('Playback error', 'Không thể phát đoạn này. Vui lòng thử lại.');
    } finally {
      setPlayLoading(false);
    }
  };

  const stopSnippet = async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync().catch(() => {});
    }
    await unloadSound();
    setIsPlaying(false);
  };

  const pickBestChorus = () => {
    const segmentLength = Math.min(30, maxSnippetLength);
    const chorusStart = Math.max(0, Math.floor(Math.min(effectiveDuration - segmentLength, effectiveDuration * 0.35)));
    setStartTime(chorusStart);
    setEndTime(chorusStart + segmentLength);
  };

  const handlePost = async () => {
    if (!caption.trim()) {
      Alert.alert('Thiếu caption', 'Vui lòng nhập mô tả cho snippet.');
      return;
    }
    if (endTime - startTime < MIN_SNIPPET_DURATION) {
      Alert.alert('Đoạn quá ngắn', `Đoạn cắt phải dài ít nhất ${MIN_SNIPPET_DURATION} giây.`);
      return;
    }

    setIsLoading(true);
    try {
      await createPostApi({
        song_id: song.id,
        caption: caption.trim(),
        snippet_start_time: Math.round(startTime),
        snippet_end_time: Math.round(endTime),
      });
      Alert.alert('Thành công', 'Đã đăng snippet lên feed.');
      navigation.goBack();
    } catch (error) {
      const message = error.serverData?.message || error.response?.data?.message || error.message;
      Alert.alert('Lỗi', message || 'Không thể tạo snippet. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
      <View style={[styles.header, { paddingTop: insets.top }]}> 
        <Text style={styles.headerTitle}>Create Snippet</Text>
      </View>

      <View style={styles.songInfo}>
        <Image source={{ uri: song.cover }} style={styles.songCover} />
        <View style={styles.songDetails}>
          <Text style={styles.songTitle}>{song.title}</Text>
          <Text style={styles.songArtist}>{song.artist}</Text>
          <Text style={styles.songMeta}>{`${formatTime(effectiveDuration)} • ${song.streams?.toLocaleString() || 0} lượt nghe`}</Text>
        </View>
      </View>

      <View style={styles.editor}>
        <Text style={styles.sectionTitle}>1. Chọn đoạn cắt</Text>
        <Text style={styles.infoText}>Kéo hai đầu mút của vùng chọn trên waveform để chọn đoạn nhạc muốn chia sẻ. Giữ cho đoạn tối thiểu {MIN_SNIPPET_DURATION}s.</Text>
        <View style={styles.waveformContainer} onLayout={handleTimelineLayout}>
          {waveformBars.map((height, index) => {
            const position = (index / (waveformBars.length - 1)) * 100;
            const selectedRight = selectedLeft + selectedWidth;
            const isSelected = position >= selectedLeft - 2 && position <= selectedRight + 2;
            return (
              <View
                key={index}
                style={[
                  styles.waveformBar,
                  { height: `${18 + height * 70}%`, backgroundColor: isSelected ? COLORS.accentPurple : COLORS.foregroundSecondary + '22' },
                ]}
              />
            );
          })}
          <View style={[styles.waveformSelectionOverlay, { left: `${selectedLeft}%`, width: `${selectedWidth}%`, backgroundColor: selectionOverlayColor }]} {...selectionResponder.panHandlers} />
          <View style={[styles.handle, activeHandle === 'start' && styles.handleActive, { left: `${selectedLeft}%` }]} {...startHandleResponder.panHandlers}>
            <View style={styles.handleDot} />
          </View>
          <View style={[styles.handle, activeHandle === 'end' && styles.handleActive, { left: `${selectedLeft + selectedWidth}%` }]} {...endHandleResponder.panHandlers}>
            <View style={styles.handleDot} />
          </View>
        </View>
        <View style={styles.timeLabels}>
          <View>
            <Text style={styles.timeTextBold}>Bắt đầu</Text>
            <Text style={styles.timeTextNormal}>{formatTime(startTime)}</Text>
          </View>
          <View>
            <Text style={styles.timeTextBold}>Độ dài</Text>
            <Text style={styles.timeTextNormal}>{formatTime(selectedDuration)}</Text>
          </View>
          <View>
            <Text style={styles.timeTextBold}>Kết thúc</Text>
            <Text style={styles.timeTextNormal}>{formatTime(endTime)}</Text>
          </View>
        </View>
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.playButton, isPlaying && styles.playButtonActive]}
            onPress={isPlaying ? stopSnippet : playSnippet}
            disabled={playLoading}
          >
            {playLoading ? (
              <ActivityIndicator color={COLORS.background} />
            ) : (
              <Text style={styles.playButtonText}>{isPlaying ? 'Stop' : 'Play đoạn'}</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.autoPickButton} onPress={pickBestChorus}>
            <Text style={styles.autoPickButtonText}>Auto Chorus</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.autoPickHint}>Auto Chorus sẽ chọn đoạn 15–30s ở giữa bài, thường là phần điệp khúc hoặc cao trào.</Text>
      </View>

      <View style={styles.editor}>
        <Text style={styles.sectionTitle}>2. Viết caption</Text>
        <TextInput
          style={styles.captionInput}
          placeholder="Viết cảm nhận hoặc lý do bạn chọn đoạn nhạc này..."
          placeholderTextColor={COLORS.foregroundSecondary}
          value={caption}
          onChangeText={setCaption}
          multiline
        />
      </View>

      <View style={styles.footer}>
        <Button title="Post Snippet" onPress={handlePost} loading={isLoading} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    color: COLORS.foreground,
    fontSize: 20,
    fontWeight: 'bold',
  },
  songInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.backgroundAlt,
  },
  songCover: { width: 60, height: 60, borderRadius: 8 },
  songDetails: { marginLeft: 12, flex: 1 },
  songTitle: { color: COLORS.foreground, fontSize: 16, fontWeight: 'bold' },
  songArtist: { color: COLORS.foregroundSecondary, fontSize: 14, marginTop: 4 },
  songMeta: { color: COLORS.foregroundSecondary, fontSize: 12, marginTop: 6 },
  editor: { padding: 16, marginTop: 16 },
  sectionTitle: {
    color: COLORS.foreground,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoText: {
    color: COLORS.foregroundSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  waveformContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 92,
    paddingHorizontal: 6,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundAlt,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: COLORS.foreground,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
  },
  waveformBar: {
    flex: 1,
    marginHorizontal: 1,
    backgroundColor: COLORS.foregroundSecondary + '22',
    borderRadius: 4,
  },
  waveformSelectionOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.accentPurple + '55',
    shadowColor: COLORS.accentPurple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  handle: {
    position: 'absolute',
    top: 4,
    width: 44,
    height: 44,
    marginLeft: -22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handleActive: {
    transform: [{ scale: 1.08 }],
  },
  handleDot: {
    width: 14,
    height: 14,
    borderRadius: 8,
    backgroundColor: COLORS.accentPurple,
    borderWidth: 1,
    borderColor: COLORS.background,
  },
  timeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timeTextBold: {
    color: COLORS.foreground,
    fontSize: 13,
    fontWeight: '600',
  },
  timeTextNormal: {
    color: COLORS.foregroundSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 16,
  },
  playButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accentPurple,
  },
  playButtonActive: {
    backgroundColor: COLORS.foreground,
  },
  playButtonText: {
    color: COLORS.background,
    fontSize: 14,
    fontWeight: '700',
  },
  autoPickButton: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: COLORS.backgroundAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  autoPickButtonText: {
    color: COLORS.foreground,
    fontSize: 13,
    fontWeight: '700',
  },
  autoPickHint: {
    color: COLORS.foregroundSecondary,
    fontSize: 12,
    marginTop: 10,
    lineHeight: 18,
  },
  captionInput: {
    backgroundColor: COLORS.backgroundAlt,
    borderRadius: 12,
    padding: 14,
    color: COLORS.foreground,
    fontSize: 15,
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  footer: { padding: 16, marginTop: 24 },
});
