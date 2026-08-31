import React, { useEffect, useState } from 'react';
import { View, Text, Animated, Dimensions } from 'react-native';
import { useTheme } from '~/hooks/useTheme';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  visible: boolean;
  onHide: () => void;
}

export function Toast({ 
  message, 
  type = 'error', 
  duration = 3000, 
  visible, 
  onHide 
}: ToastProps) {
  const { colors } = useTheme();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(-100));

  useEffect(() => {
    if (visible) {
      // Show animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  };

  const getToastColors = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: colors.success + '20',
          borderColor: colors.success + '60',
          textColor: colors.success,
        };
      case 'warning':
        return {
          backgroundColor: colors.warning + '20',
          borderColor: colors.warning + '60',
          textColor: colors.warning,
        };
      case 'info':
        return {
          backgroundColor: colors.primary + '20',
          borderColor: colors.primary + '60',
          textColor: colors.primary,
        };
      default: // error
        return {
          backgroundColor: colors.error + '20',
          borderColor: colors.error + '60',
          textColor: colors.error,
        };
    }
  };

  const toastColors = getToastColors();

  if (!visible) return null;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 50,
        left: 16,
        right: 16,
        zIndex: 9999,
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <View
        style={{
          backgroundColor: toastColors.backgroundColor,
          borderWidth: 1,
          borderColor: toastColors.borderColor,
          borderRadius: 12,
          padding: 16,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5,
        }}
      >
        <Text
          style={{
            color: toastColors.textColor,
            fontSize: 14,
            fontWeight: '500',
            textAlign: 'center',
          }}
        >
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}
