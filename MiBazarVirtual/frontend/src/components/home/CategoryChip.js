import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity } from 'react-native';

import { colors, spacing, typography } from '../../theme';

export default function CategoryChip({ category, isActive = false, onPress }) {
  const activeValue = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(activeValue, {
      toValue: isActive ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [activeValue, isActive]);

  const backgroundColor = activeValue.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.background, colors.primary],
  });

  const textColor = activeValue.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.textSecondary, colors.surface],
  });

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
      <Animated.View style={[styles.chip, { backgroundColor }]}>
        <Animated.Text style={[styles.text, { color: textColor }]}>
          {category.icon ? `${category.icon} ` : ''}{category.name}
        </Animated.Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    marginRight: spacing.sm,
  },
  text: {
    ...typography.small,
    fontWeight: '600',
  },
});
