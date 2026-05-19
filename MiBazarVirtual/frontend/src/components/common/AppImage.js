import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

import { colors, typography } from '../../theme';
import SkeletonLoader from './SkeletonLoader';

export default function AppImage({
  uri,
  style,
  contentFit = 'cover',
  fallbackEmoji = '🍽️',
  fallbackLabel = null,
}) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(Boolean(uri));
  const shouldFallback = !uri || hasError;

  useEffect(() => {
    setHasError(false);
    setIsLoading(Boolean(uri));
  }, [uri]);

  if (shouldFallback) {
    return (
      <View style={[styles.fallback, style]}>
        <Text style={styles.emoji}>{fallbackEmoji}</Text>
        {fallbackLabel ? <Text style={styles.label}>{fallbackLabel}</Text> : null}
      </View>
    );
  }

  return (
    <View style={[styles.wrap, style]}>
      <Image
        source={{ uri }}
        style={styles.image}
        contentFit={contentFit}
        transition={300}
        cachePolicy="memory-disk"
        onError={() => setHasError(true)}
        onLoadStart={() => setIsLoading(true)}
        onLoad={() => setIsLoading(false)}
        onLoadEnd={() => setIsLoading(false)}
      />
      {isLoading ? <SkeletonLoader width="100%" height="100%" borderRadius={0} style={styles.loader} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    backgroundColor: colors.border,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loader: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  emoji: {
    fontSize: 32,
  },
  label: {
    ...typography.tiny,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
});
