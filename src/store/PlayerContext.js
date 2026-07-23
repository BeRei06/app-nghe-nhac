import React, { createContext, useContext, useEffect, useRef, useReducer } from 'react';
import { Audio } from 'expo-av';
import { API_BASE_URL } from '../utils/env';

const PlayerContext = createContext(null);

const initialState = {
  currentSong: null,
  isPlaying: false,
  progress: 0,
  queue: [],
  currentIndex: -1,
  snippetRange: null,
};

const normalizeSongCover = (song) => {
  if (!song || typeof song !== 'object') {
    return song;
  }

  const cover = song.cover || song.cover_url || song.coverImage || song.cover_image || null;
  return cover ? { ...song, cover } : song;
};

function playerReducer(state, action) {
  switch (action.type) {
    case 'PLAY':
      return {
        ...state,
        isPlaying: true,
        currentSong: normalizeSongCover(action.payload.song),
        currentIndex: typeof action.payload.index === 'number' ? action.payload.index : state.currentIndex,
        snippetRange: null, // Reset snippet range when playing a full song
      };
    case 'PLAY_SNIPPET':
      return {
        ...state,
        isPlaying: true,
        currentSong: normalizeSongCover(action.payload.song),
        currentIndex: typeof action.payload.index === 'number' ? action.payload.index : state.currentIndex,
        snippetRange: { start: action.payload.start, end: action.payload.end },
      };
    case 'PAUSE':
      return { ...state, isPlaying: false };
    case 'RESUME':
      return { ...state, isPlaying: true };
    case 'SET_PROGRESS':
      return { ...state, progress: action.payload };
    case 'SET_QUEUE':
      return {
        ...state,
        queue: action.payload.queue || [],
        currentIndex: typeof action.payload.index === 'number' ? action.payload.index : state.currentIndex,
      };
    case 'CLEAR_PLAYER':
      return initialState;
    default:
      return state;
  }
}

export function PlayerProvider({ children }) {
  const [state, dispatch] = useReducer(playerReducer, initialState);
  const soundRef = useRef(null);
  const snippetEndMillisRef = useRef(null);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
    };
  }, []);

  const setAudioMode = async () => {
    try {
      const interruptionModeIOS =
        Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX ??
        Audio.INTERRUPTION_MODE_IOS_DUCK_OTHERS ??
        Audio.INTERRUPTION_MODE_IOS_MIX_WITH_OTHERS;
      const interruptionModeAndroid =
        Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX ??
        Audio.INTERRUPTION_MODE_ANDROID_DUCK_OTHERS;

      const options = {
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      };

      if (interruptionModeIOS !== undefined) {
        options.interruptionModeIOS = interruptionModeIOS;
      }
      if (interruptionModeAndroid !== undefined) {
        options.interruptionModeAndroid = interruptionModeAndroid;
      }

      await Audio.setAudioModeAsync(options);
    } catch (error) {
      console.warn('[PlayerContext] setAudioMode error', error);
    }
  };

  const normalizeSourceUri = (uri) => {
    if (!uri) return uri;
    let normalized = uri;
    if (normalized.includes('%2520')) {
      normalized = normalized.replace(/%2520/g, '%20');
    }
    if (normalized.includes('%25')) {
      try {
        normalized = decodeURI(normalized);
      } catch (err) {
        console.warn('[PlayerContext] normalizeSourceUri decodeURI failed', normalized, err);
      }
    }
    return normalized;
  };

  const loadAndPlay = async (song, startMillis = 0) => {
    if (!song) {
      return;
    }

    let sourceUri = song.hls_url || song.hls_streaming_url || song.audio_url || song.url;
    if (!sourceUri) {
      console.warn('[PlayerContext] No audio source available for song', song.id, song);
      return;
    }

    if (sourceUri.startsWith('/')) {
      const apiRoot = API_BASE_URL.replace(/\/api$/, '');
      sourceUri = `${apiRoot}${sourceUri}`;
    }

    sourceUri = normalizeSourceUri(sourceUri);

    console.warn('[PlayerContext] loadAndPlay sourceUri', sourceUri, 'song.hls_url', song.hls_url, 'song.hls_streaming_url', song.hls_streaming_url);

    try {
      await setAudioMode();

      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current.setOnPlaybackStatusUpdate(null);
        soundRef.current = null;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: sourceUri },
        { shouldPlay: true, positionMillis: startMillis, progressUpdateIntervalMillis: 500 },
        (status) => {
          if (status.isLoaded) {
            dispatch({ type: 'SET_PROGRESS', payload: status.positionMillis / Math.max(1, status.durationMillis) * 100 });

            const endMillis = snippetEndMillisRef.current;
            if (endMillis !== null && status.positionMillis >= endMillis) {
              soundRef.current?.pauseAsync().catch(() => {});
              dispatch({ type: 'PAUSE' });
            }

            if (status.didJustFinish) {
              dispatch({ type: 'PAUSE' });
            }
          }
        }
      );

      soundRef.current = sound;
    } catch (error) {
      console.warn('[PlayerContext] loadAndPlay error', error);
    }
  };

  const play = async (song, options = {}) => {
    snippetEndMillisRef.current = null;
    const queue = Array.isArray(options.queue) ? options.queue : state.queue;
    const index = typeof options.index === 'number' ? options.index : state.currentIndex;
    dispatch({ type: 'SET_QUEUE', payload: { queue, index } });
    dispatch({ type: 'PLAY', payload: { song, index } });
    await loadAndPlay(song);
  };

  const playSnippet = async (song, start, end, options = {}) => {
    const startTime = Math.max(0, start || 0);
    const endTime = typeof end === 'number' ? Math.max(startTime, end) : null;
    snippetEndMillisRef.current = endTime !== null ? Math.round(endTime * 1000) : null;
    const queue = Array.isArray(options.queue) ? options.queue : state.queue;
    const index = typeof options.index === 'number' ? options.index : state.currentIndex;
    dispatch({ type: 'SET_QUEUE', payload: { queue, index } });
    dispatch({ type: 'PLAY_SNIPPET', payload: { song, start: startTime, end: endTime, index } });
    await loadAndPlay(song, Math.round(startTime * 1000));
  };

  const pause = async () => {
    if (soundRef.current) {
      await soundRef.current.pauseAsync().catch(() => {});
    }
    dispatch({ type: 'PAUSE' });
  };

  const resume = async () => {
    if (soundRef.current) {
      await soundRef.current.playAsync().catch(() => {});
    }
    dispatch({ type: 'RESUME' });
  };

  const playPrevious = async () => {
    if (!state.queue?.length) return;
    const nextIndex = Math.max(0, state.currentIndex - 1);
    const item = state.queue[nextIndex];
    if (!item) return;
    const song = item.song || item;
    const start = item.snippet_start ?? 0;
    const end = item.snippet_end ?? null;
    dispatch({ type: 'SET_QUEUE', payload: { queue: state.queue, index: nextIndex } });
    if (end !== null) {
      await playSnippet(song, start, end, { queue: state.queue, index: nextIndex });
    } else {
      await play(song, { queue: state.queue, index: nextIndex });
    }
  };

  const playNext = async () => {
    if (!state.queue?.length) return;
    const nextIndex = Math.min(state.queue.length - 1, state.currentIndex + 1);
    const item = state.queue[nextIndex];
    if (!item) return;
    const song = item.song || item;
    const start = item.snippet_start ?? 0;
    const end = item.snippet_end ?? null;
    dispatch({ type: 'SET_QUEUE', payload: { queue: state.queue, index: nextIndex } });
    if (end !== null) {
      await playSnippet(song, start, end, { queue: state.queue, index: nextIndex });
    } else {
      await play(song, { queue: state.queue, index: nextIndex });
    }
  };

  const value = {
    ...state,
    play,
    playSnippet,
    playPrevious,
    playNext,
    pause,
    resume,
  };

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}