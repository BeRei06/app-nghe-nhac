import client from './client';

/**
 * Gửi yêu cầu đăng nhập đến server.
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<any>} Dữ liệu trả về từ API.
 */
export const login = (email, password) => {
  return client.post('/auth/login', { email, password });
};

/**
 * Gửi yêu cầu đăng ký tài khoản mới.
 * @param {object} userData - Dữ liệu người dùng (ví dụ: { name, email, password }).
 * @returns {Promise<any>} Dữ liệu trả về từ API.
 */
export const register = (userData) => {
  return client.post('/auth/register', userData);
};

export const verifyEmail = (email, code) => {
  return client.post('/auth/verify-email', { email, code });
};

export const resendVerificationEmail = (email) => {
  return client.post('/auth/resend-verification-email', { email });
};

// Các hàm API khác liên quan đến auth có thể được thêm vào đây
// ví dụ: forgotPassword, resetPassword, verifyEmail, etc.
