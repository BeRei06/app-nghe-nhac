import client from './client';

export const uploadSongApi = (formData) => client.post('/upload/audio', formData);
export const getUploadStatusApi = (songId) => client.get(`/upload/status/${songId}`);
export const getArtistSuggestionsApi = (q = '') => client.get(`/artists/suggest`, { params: { q } });
export const resolveArtistApi = (name) => client.post('/artists/resolve', { name });
