import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'userToken';
const USER_DATA_KEY = 'userData';
const TASTE_TAGS_KEY = 'tasteTags';

/**
 * Lưu trữ JWT token vào AsyncStorage.
 * @param {string} token - JWT token.
 */
export const storeToken = async (token) => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch (e) {
    console.error('Failed to save the token to storage', e);
  }
};

/**
 * Lấy JWT token từ AsyncStorage.
 * @returns {Promise<string|null>} - JWT token hoặc null nếu không tìm thấy.
 */
export const getToken = async () => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (e) {
    console.error('Failed to fetch the token from storage', e);
    return null;
  }
};

/**
 * Xóa JWT token khỏi AsyncStorage.
 */
export const removeToken = async () => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (e) {
    console.error('Failed to remove the token from storage', e);
  }
};

/**
 * Lưu trữ thông tin người dùng vào AsyncStorage.
 * @param {object} user - Đối tượng thông tin người dùng.
 */
export const storeUser = async (user) => {
    try {
      const jsonValue = JSON.stringify(user);
      await AsyncStorage.setItem(USER_DATA_KEY, jsonValue);
    } catch (e) {
      console.error('Failed to save user data to storage', e);
    }
};

/**
 * Lấy thông tin người dùng từ AsyncStorage.
 * @returns {Promise<object|null>} - Đối tượng người dùng hoặc null.
 */
export const getUser = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem(USER_DATA_KEY);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (e) {
      console.error('Failed to fetch user data from storage', e);
      return null;
    }
};

/**
 * Xóa thông tin người dùng khỏi AsyncStorage.
 */
export const removeUser = async () => {
    try {
      await AsyncStorage.removeItem(USER_DATA_KEY);
    } catch (e) {
      console.error('Failed to remove user data from storage', e);
    }
};

export const saveTags = async (tags) => {
  await AsyncStorage.setItem(TASTE_TAGS_KEY, JSON.stringify(tags));
};

export const getTags = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(TASTE_TAGS_KEY);
    return jsonValue ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error('Failed to fetch taste tags from storage', e);
    return [];
  }
};

export const removeTags = async () => {
  await AsyncStorage.removeItem(TASTE_TAGS_KEY);
};
