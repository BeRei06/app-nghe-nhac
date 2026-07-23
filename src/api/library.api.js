import client from './client';

const MOCK_SONGS_FOR_LIBRARY = [
  { id: 1, title: 'Blinding Lights', artist: 'The Weeknd', cover: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36', duration: 200 },
  { id: 2, title: 'As It Was', artist: 'Harry Styles', cover: 'https://i.scdn.co/image/ab67616d0000b273b46f74097655d7f353caab14', duration: 167 },
  { id: 5, title: 'Stay', artist: 'The Kid LAROI, Justin Bieber', cover: 'https://i.scdn.co/image/ab67616d0000b27341e31d6ea1d4633609347a76', duration: 141 },
];

const MOCK_PLAYLISTS = [
    { id: 1, name: 'My Driving Mix', song_count: 25, cover: 'https://i.scdn.co/image/ab67706c0000da84b533a5a5c260256a29775933' },
    { id: 2, name: 'Workout Jams', song_count: 50, cover: 'https://i.scdn.co/image/ab67706c0000da841b18d36381c3c13a10048893' },
];

const mockApi = (data) => new Promise(resolve => setTimeout(() => resolve({ data }), 300));

export const getLibraryLikedSongsApi = () => mockApi(MOCK_SONGS_FOR_LIBRARY);
export const getLibraryDownloadsApi = () => mockApi(MOCK_SONGS_FOR_LIBRARY.slice(0, 1)); // Only one downloaded song
export const getLibraryPlaylistsApi = () => mockApi(MOCK_PLAYLISTS);