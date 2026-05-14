import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { colors } from '../../theme';

export default function LoadingSpinner({ size = 'large', fullScreen = false }) {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator size={size} color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: colors.surface,
  },
});
