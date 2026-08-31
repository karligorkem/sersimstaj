import React, { createContext, useState, useEffect, useContext } from 'react';
import { AuthService } from '~/services/auth.service';
import { useRouter, useSegments } from 'expo-router';
import { UserRole } from '~/types/index'; 


export interface User {
  username: string | null;
  role: UserRole | null;
  line?: string | null;
}

interface AuthContextType {
  user: User | null;
  signIn: (credentials: { username: string; password: string }) => Promise<void>;
  signOut: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = await AuthService.getToken();
        if (token) {
          
          const userInfo = await AuthService.getUserInfo();
          if (userInfo) {
            setUser({
              username: userInfo.username,
              role: userInfo.role as UserRole,
              line: userInfo.line,
            });
          }
        }
      } catch (error) {
        console.error('Auth durumu yüklenemedi:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === '(auth)';

    const performNavigation = () => {
      try {
        if (user && inAuthGroup) {
          // SuperAdmin kullanıcıları direkt profil sayfasına yönlendir
          if (user.role === 'SuperAdmin') {
            router.replace('/(tabs)/profile');
          } else {
            router.replace('/(tabs)/home');
          }
        } else if (!user && !inAuthGroup) {
          router.replace('/(auth)/sign-in');
        }
      } catch (error) {
        console.warn('Auth navigation hatası:', error);
      }
    };

    setTimeout(performNavigation, 50);
  }, [user, isLoading, segments]);

  const signIn = async (credentials: { username: string; password: string }) => {
    
    await AuthService.login(credentials.username, credentials.password);
        
    const userInfo = await AuthService.getUserInfo();
    if (userInfo) {
      const userData = {
        username: userInfo.username,
        role: userInfo.role as UserRole,
        line: userInfo.line,
      };
      setUser(userData);

      setTimeout(() => {
        try {
          // SuperAdmin kullanıcıları direkt profil sayfasına yönlendir
          if (userData.role === 'SuperAdmin') {
            router.replace('/(tabs)/profile');
          } else {
            router.replace('/(tabs)/home');
          }
        } catch (error) {
          console.warn('SignIn navigation hatası:', error);
        }
      }, 50);
    }
  };

  const signOut = async () => {
    await AuthService.logout();
    setUser(null);

    setTimeout(() => {
      try {
        router.replace('/(auth)/sign-in');
      } catch (error) {
        console.warn('SignOut navigation hatası:', error);
      }
    }, 50);
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signOut, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};