// components/FloatingButton.tsx
import React, { useRef } from "react";
import { TouchableOpacity, Animated, StyleSheet } from "react-native";
import { Plus } from "lucide-react-native";
import { useTheme } from "~/hooks/useTheme";

type Props = {
  onPress: () => void;
};

export default function FloatingButton({ onPress }: Props) {
  const { colors } = useTheme();
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: scaleValue }],
        },
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.button,
          {
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
          }
        ]}
        activeOpacity={0.8}
      >
        <Plus
          color={colors.primaryForeground}
          size={28}
          strokeWidth={2.5}
        />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    elevation: 8, 
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    zIndex: 1000,
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8, 
  },
});