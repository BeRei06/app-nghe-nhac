import client from './client';

/**
 * Lấy danh sách các bài hát.
 * @param {object} params - Các tham số truy vấn.
 * @returns {Promise<any>}
 */
export const getSongs = (params) => {
  return client.get('/songs', { params });
};

/**
 * Lấy thông tin chi tiết của một bài hát bằng ID.
 * @param {string} songId - ID của bài hát.
 * @returns {Promise<any>}
 */
export const getSongByIdApi = (songId) => {
  return client.get(`/songs/${songId}`);
};

export const getRecommendedApi = (params) => {
  return client.get('/songs/recommended', { params });
};

export const getTopChartApi = (params) => {
  return client.get('/songs/top-chart', { params });
};

export const getTrendingApi = (params) => {
  return client.get('/songs/trending', { params });
};

export const getMySongsApi = (params) => {
  return client.get('/songs/me', { params });
};

/**
 * Tải lên một bài hát mới.
 * Yêu cầu `Content-Type` là `multipart/form-data`.
 * @param {FormData} formData - Dữ liệu form chứa file nhạc và các thông tin khác.
 * @returns {Promise<any>}
 */
export const uploadSong = (formData) => {
  return client.post('/upload/song', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

/**
 * Tăng lượt nghe cho một bài hát.
 * @param {string} songId - ID của bài hát.
 * @returns {Promise<any>}
 */
export const incrementListenCount = (songId) => {
    return client.post(`/songs/${songId}/listen`);
};
