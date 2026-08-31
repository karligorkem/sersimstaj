import axios from 'axios';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store'; 

const TOKEN_KEY = 'accessToken'; 
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_BASE_URL) {
  console.warn('EXPO_PUBLIC_API_URL tanımlı değil. API istekleri çalışmayacaktır.');
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // FormData için Content-Type'ı kaldır, axios otomatik ayarlasın
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    console.log(`API Success: ${response.config.method?.toUpperCase()} ${response.config.url}`);
    return response;
  },
  async (error) => {
    if (error.response) {
      console.error(`API Error: ${error.response.status} - ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
      if (error.response.status === 401) {
        console.log('Unauthorized - redirecting to login');
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        
        setTimeout(() => {
          try {
            router.replace('/(auth)/sign-in');
          } catch (routerError) {
            console.warn('Router redirect hatası:', routerError);
          }
        }, 100);
      }
    } else if (error.request) {
      console.error(`Network Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
    } else {
      console.error('Request Setup Error:', error.message);
    }

    return Promise.reject(error);
  }
);

export default api;
