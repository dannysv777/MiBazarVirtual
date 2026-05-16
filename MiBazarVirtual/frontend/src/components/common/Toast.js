import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, shadows, spacing, typography } from '../../theme';

const variants = {
  success: { icon: 'checkmark-circle', color: colors.success },
  error: { icon: 'close-circle', color: colors.error },
  warning: { icon: 'warning', color: colors.warning },
  info: { icon: 'information-circle', color: '#3B82F6' },
};

export default function Toast({ toast, onDismiss, index = 0 }) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const palette = variants[toast.variant] ?? variants.info;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, friction: 8 }),
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();

    const timerId = setTimeout(() => onDismiss(toast.id), toast.duration ?? 3000);
    return () => clearTimeout(timerId);
  }, [onDismiss, opacity, toast.duration, toast.id, translateY]);

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          top: insets.top + spacing.sm + index * 62,
          opacity,
          transform: [{ translateY }],
          borderLeftColor: palette.color,
        },
      ]}
    >
      <TouchableOpacity activeOpacity={0.9} onPress={() => onDismiss(toast.id)} style={styles.content}>
        <Ionicons name={palette.icon} size={22} color={palette.color} />
        <Text style={styles.message} numberOfLines={2}>{toast.message}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    zIndex: 9999,
    borderLeftWidth: 4,
    borderRadius: 12,
    backgroundColor: colors.surface,
    ...shadows.strong,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  message: {
    ...typography.small,
    flex: 1,
    color: colors.textPrimary,
    fontWeight: '700',
    marginLeft: spacing.sm,
  },
});
