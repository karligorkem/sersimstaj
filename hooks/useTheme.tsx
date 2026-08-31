// hooks/useTheme.tsx
import { useState } from 'react';
import { useColorScheme } from 'react-native';

export type Theme = 'light' | 'dark' | 'system';

export function useTheme() {
  const systemColorScheme = useColorScheme();
  const [userTheme, setUserTheme] = useState<Theme>('system');
  
 
  const isDark = userTheme === 'dark' || 
    (userTheme === 'system' && systemColorScheme === 'dark');
  
  const colors = {
    background: isDark ? '#0f172a' : '#f8fafc',
    surface: isDark ? '#1e293b' : '#ffffff',
    surfaceSecondary: isDark ? '#334155' : '#f1f5f9',
    primary: isDark ? '#22d3ee' : '#0ea5e9',
    primaryForeground: isDark ? '#0f172a' : '#ffffff',
    text: isDark ? '#f8fafc' : '#1e293b',
    textSecondary: isDark ? '#cbd5e1' : '#64748b',
    textMuted: isDark ? '#94a3b8' : '#9ca3af',
    border: isDark ? '#374151' : '#e2e8f0',
    success: isDark ? '#22c55e' : '#16a34a',
    warning: isDark ? '#f59e0b' : '#d97706',
    error: isDark ? '#ef4444' : '#dc2626',
    accent: isDark ? '#8b5cf6' : '#7c3aed',
  };

  return {
    theme: userTheme,
    setTheme: setUserTheme,
    isDark,
    colors,
    systemColorScheme, // Sistem temasını da döndür
  };
}