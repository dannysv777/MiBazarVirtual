import { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';

import { colors } from '../../theme';

export default function SkeletonLoader({ width, height, borderRadius = 12, style }) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.loader,
        { width, height, borderRadius, opacity },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  loader: {
    backgroundColor: colors.border,
  },
});
