import client from './client';

export const getFeedApi = (params) => client.get('/feed', { params });
export const getSongPostsApi = (songId, params = {}) => client.get('/posts', { params: { song_id: songId, ...params } });

export const createPostApi = (data) => client.post('/posts', data);
export const reactPostApi = (postId, type = 'like') => client.post(`/posts/${postId}/react`, { type });
export const deletePostApi = (postId) => client.delete(`/posts/${postId}`);
