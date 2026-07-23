import React, { createContext, useState, useEffect, useContext } from 'react';
import client from '../api/client';
import * as AuthAPI from '../api/auth.api'; // <-- Import các hàm API
import { 
  storeToken, 
  getToken, 
  removeToken, 
  storeUser, 
  getUser, 
  removeUser 
} from '../utils/storage'; // <-- Import các hàm tiện ích storage
import { getTags, removeTags } from '../utils/storage';

// 1. Tạo Context
const AuthContext = createContext();

// 2. Tạo Provider Component
const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    token: null,
    user: null,
    tasteTags: [],
    isAuthenticated: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Effect để load token từ storage khi app khởi động
  useEffect(() => {
    const loadAuthState = async () => {
      try {
        const token = await getToken();
        const user = await getUser();
        const tasteTags = await getTags();

        if (token && user) {
          client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          setAuthState({
            token,
            user,
            tasteTags,
            isAuthenticated: true,
          });
        }
      } catch (e) {
        console.error("Failed to load auth state from storage", e);
      } finally {
        setIsLoading(false);
      }
    };

    loadAuthState();
  }, []);

  // Hàm đăng nhập
  const login = async (email, password) => {
    try {
      const response = await AuthAPI.login(email, password);
      const payload = response?.success !== undefined ? response : response?.data || response;

      if (!payload || payload.success !== true) {
        const message = payload?.message || 'Email hoặc mật khẩu không đúng.';
        throw new Error(message);
      }

      const { user, access_token: token, refresh_token: refreshToken } = payload.data || {};
      if (!token || !user) {
        throw new Error('Dữ liệu phản hồi không hợp lệ từ máy chủ.');
      }

      await storeToken(token);
      await storeUser(user);
      client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const tasteTags = await getTags();

      setAuthState({
        token,
        user,
        tasteTags,
        isAuthenticated: true,
      });

      return { success: true };
    } catch (error) {
      const serverData = error.response?.data;
      const serverMessage = serverData && typeof serverData === 'object' ? serverData.message : serverData;
      const message = serverMessage || error.message || 'Có lỗi xảy ra, vui lòng thử lại.';
      console.error('Login failed:', {
        message,
        status: error.response?.status,
        data: error.response?.data,
        original: error,
      });
      return { success: false, error: message };
    }
  };

  // Hàm đăng ký
  const register = async (userData) => {
    try {
      const response = await AuthAPI.register(userData);
      const payload = response?.success !== undefined ? response : response?.data || response;

      if (!payload || payload.success !== true) {
        throw new Error(payload?.message || 'Đăng ký thất bại.');
      }

      return { success: true, data: payload.data };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Có lỗi xảy ra, vui lòng thử lại.';
      console.error('Registration failed:', {
        message,
        status: error.status ?? error.response?.status,
        data: error.serverData ?? error.response?.data,
        originalError: error,
      });
      return { success: false, error: message };
    }
  };

  const verifyEmail = async (email, code) => {
    const response = await AuthAPI.verifyEmail(email, code);
    const payload = response?.success !== undefined ? response : response?.data || response;
    if (!payload?.success) {
      throw new Error(payload?.message || 'Không thể xác thực email.');
    }
    return payload;
  };

  const resendVerificationEmail = async (email) => {
    const response = await AuthAPI.resendVerificationEmail(email);
    const payload = response?.success !== undefined ? response : response?.data || response;
    if (!payload?.success) {
      throw new Error(payload?.message || 'Không thể gửi lại mã xác thực.');
    }
    return payload;
  };


  // Hàm đăng xuất
  const logout = async () => {
    try {
      await removeToken();
      await removeUser();
      await removeTags();

      delete client.defaults.headers.common['Authorization'];

      setAuthState({
        token: null,
        user: null,
        tasteTags: [],
        isAuthenticated: false,
      });
    } catch (e) {
      console.error("Failed to logout", e);
    }
  };

  const updateUser = async (updates) => {
    const nextUser = { ...authState.user, ...updates };
    const nextTasteTags = updates.tasteTags || authState.tasteTags;
    await storeUser(nextUser);
    setAuthState((current) => ({
      ...current,
      user: nextUser,
      tasteTags: nextTasteTags,
    }));
  };

  const value = {
    ...authState,
    isLoading,
    login,
    logout,
    register,
    updateUser,
    loading: isLoading,
    verifyEmail,
    resendVerificationEmail,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// 3. Tạo Custom Hook để sử dụng Context
const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { AuthProvider, useAuth };
