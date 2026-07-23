import client from './client';

/**
 * Lấy thông tin công khai của một người dùng bằng ID.
 * @param {string} userId - ID của người dùng.
 * @returns {Promise<any>}
 */
export const getUserProfile = (userId) => {
  return client.get(`/users/${userId}`);
};

/**
 * Lấy thông tin chi tiết của người dùng đang đăng nhập.
 * @returns {Promise<any>}
 */
export const getMyProfile = () => {
  return client.get('/users/me'); // Giả định endpoint là /users/me
};

/**
 * Cập nhật thông tin của người dùng đang đăng nhập.
 * @param {object} profileData - Dữ liệu cần cập nhật.
 * @returns {Promise<any>}
 */
export const updateUserProfile = (profileData) => {
  return client.put('/users/me', profileData); // Giả định endpoint là /users/me
};

/**
 * Theo dõi một người dùng khác.
 * @param {string} userId - ID của người dùng cần theo dõi.
 * @returns {Promise<any>}
 */
export const followUser = (userId) => {
  return client.post(`/users/${userId}/follow`);
};

/**
 * Bỏ theo dõi một người dùng.
 * @param {string} userId - ID của người dùng cần bỏ theo dõi.
 * @returns {Promise<any>}
 */
export const unfollowUser = (userId) => {
  return client.delete(`/users/${userId}/follow`);
};
