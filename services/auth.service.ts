import api from '~/services/api';
import * as SecureStore from 'expo-secure-store';
import { LoginResponse, UserInfo } from '~/types/index';
import { jwtDecode } from 'jwt-decode';

const TOKEN_KEY = 'accessToken';

const login = async (username: string, password: string): Promise<LoginResponse> => {
  const response = await api.post('/Users/login', { username, password });
  const { token } = response.data;
  
  // Token'ı güvenli depolamaya kaydet
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  
  // API'nin varsayılan başlıklarına token'ı ekle
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

  return response.data;
};
//
const isTokenValid = (token: string): boolean => {
  try {
    const decoded = jwtDecode(token);
    return decoded.exp! * 1000 > Date.now();
  } catch {
    return false;
  }
};

const logout = async (): Promise<void> => {
  // Token'ı güvenli depolamadan sil
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  
  // API'nin varsayılan başlıklarından token'ı kaldır
  delete api.defaults.headers.common['Authorization'];
};

const getToken = async (): Promise<string | null> => {
  return await SecureStore.getItemAsync(TOKEN_KEY);
};

const getUserInfo = async (): Promise<UserInfo | null> => {
  const token = await getToken();
  if (!token) {
    return null;
  }
  try {
    // Token'ı decode ederek içindeki bilgilere ulaş
    const decodedToken: any = jwtDecode(token);
    
    // JWT token'daki claim'leri doğru şekilde çıkar
    const userInfo = {
      username: decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || decodedToken.unique_name,
      line: decodedToken.lineId ? `Line ${decodedToken.lineId}` : undefined,
      role: decodedToken['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || decodedToken.role,
    };
    return userInfo;
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};

export const AuthService = {
  login,
  logout,
  getToken,
  getUserInfo,
};