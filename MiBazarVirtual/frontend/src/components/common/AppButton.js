import * as Haptics from 'expo-haptics';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';

import { colors, typography } from '../../theme';
import { scale } from '../../utils/responsive';

const heights = {
  sm: scale(36),
  md: scale(48),
  lg: scale(56),
};

export default function AppButton({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = false,
  size = 'md',
}) {
  const isDisabled = disabled || loading;
  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handlePress}
      disabled={isDisabled}
      style={[
        styles.button,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? colors.surface : colors.primary} />
      ) : (
        <Text style={[styles.text, styles[`${variant}Text`]]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: scale(12),
    paddingHorizontal: scale(18),
  },
  sm: {
    height: heights.sm,
  },
  md: {
    height: heights.md,
  },
  lg: {
    height: heights.lg,
  },
  fullWidth: {
    width: '100%',
  },
  primary: {
    backgroundColor: colors.primary,
  },
  outline: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  danger: {
    backgroundColor: colors.error,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    ...typography.bodyBold,
  },
  primaryText: {
    color: colors.surface,
  },
  outlineText: {
    color: colors.primary,
  },
  dangerText: {
    color: colors.surface,
  },
});
