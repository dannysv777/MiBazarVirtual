import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { subscribeNetworkStatus } from '../../api/axiosConfig';
import { colors, spacing, typography } from '../../theme';

export default function NetworkBanner() {
  const insets = useSafeAreaInsets();
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => subscribeNetworkStatus(setIsOnline), []);

  if (isOnline) return null;

  return (
    <View style={[styles.banner, { paddingTop: insets.top + spacing.xs }]}>
      <Text style={styles.text}>Sin conexion. Revisa tu internet.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
    backgroundColor: colors.error,
  },
  text: {
    ...typography.tiny,
    color: colors.surface,
    fontWeight: '800',
  },
});
