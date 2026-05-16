import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { colors, spacing, typography } from '../../theme';
import { scale } from '../../utils/responsive';

export default function AppInput({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry,
  leftIcon,
  rightIcon,
  multiline = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
}) {
  const [focused, setFocused] = useState(false);
  const progress = useRef(new Animated.Value(value ? 1 : 0)).current;
  const shouldFloat = focused || Boolean(value);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: shouldFloat ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [progress, shouldFloat]);

  const labelStyle = {
    top: progress.interpolate({ inputRange: [0, 1], outputRange: [17, -8] }),
    fontSize: progress.interpolate({ inputRange: [0, 1], outputRange: [15, 12] }),
    color: focused ? colors.primary : colors.textSecondary,
  };

  return (
    <View style={styles.wrapper}>
      <View style={[styles.container, focused && styles.focused, error && styles.errorBorder, multiline && styles.multilineContainer]}>
        {leftIcon ? <Ionicons name={leftIcon} size={scale(20)} color={colors.textSecondary} style={styles.leftIcon} /> : null}
        <Animated.Text style={[styles.label, labelStyle, leftIcon && styles.labelWithLeftIcon]}>
          {label}
        </Animated.Text>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={shouldFloat ? placeholder : ''}
          placeholderTextColor={colors.textLight}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[styles.input, leftIcon && styles.inputWithLeftIcon, rightIcon && styles.inputWithRightIcon, multiline && styles.multilineInput]}
        />
        {rightIcon ? (
          <TouchableOpacity activeOpacity={0.7} onPress={rightIcon.onPress} style={styles.rightIcon}>
            <Ionicons name={rightIcon.name} size={scale(20)} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
  },
  container: {
    height: scale(56),
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: scale(12),
    justifyContent: 'center',
  },
  focused: {
    borderColor: colors.primary,
  },
  errorBorder: {
    borderColor: colors.error,
  },
  multilineContainer: {
    height: scale(112),
    paddingTop: spacing.md,
    justifyContent: 'flex-start',
  },
  label: {
    position: 'absolute',
    left: spacing.md,
    zIndex: 1,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.xs,
  },
  labelWithLeftIcon: {
    left: 44,
  },
  input: {
    ...typography.body,
    height: '100%',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  inputWithLeftIcon: {
    paddingLeft: 44,
  },
  inputWithRightIcon: {
    paddingRight: 44,
  },
  multilineInput: {
    minHeight: scale(88),
    textAlignVertical: 'top',
  },
  leftIcon: {
    position: 'absolute',
    left: spacing.md,
    zIndex: 2,
  },
  rightIcon: {
    position: 'absolute',
    right: spacing.md,
    zIndex: 2,
  },
  errorText: {
    ...typography.small,
    color: colors.error,
    marginTop: spacing.xs,
  },
});
