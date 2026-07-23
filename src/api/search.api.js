import client from './client';

export const searchApi = ({ q, type = 'all' }) => {
  return client.get('/search', { params: { q: q.trim(), type } }).then((response) => {
    const payload = response?.data || response;
    return {
      data: {
        songs: payload.songs || [],
        artists: payload.artists || payload.users || [],
        playlists: payload.playlists || [],
        hashtags: payload.hashtags || [],
      },
    };
  });
};