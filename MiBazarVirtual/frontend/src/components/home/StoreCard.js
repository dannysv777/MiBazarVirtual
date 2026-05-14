import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { colors, shadows, spacing, typography } from '../../theme';

export default function StoreCard({ store, onPress }) {
  const initial = store.name?.charAt(0)?.toUpperCase() ?? 'M';

  return (
    <TouchableOpacity activeOpacity={0.88} onPress={onPress} style={styles.card}>
      <View style={styles.imagePlaceholder}>
        <Text style={styles.initial}>{initial}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>{store.name}</Text>
        <Text style={styles.rating}>⭐ {Number(store.rating ?? store.averageRating ?? 0).toFixed(1)}</Text>
        <Text style={styles.city} numberOfLines={1}>{store.city ?? 'Guatemala'}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 160,
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: spacing.md,
    ...shadows.card,
  },
  imagePlaceholder: {
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
  },
  initial: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.surface,
  },
  content: {
    padding: 10,
  },
  name: {
    ...typography.bodyBold,
    minHeight: 38,
    textAlign: 'center',
  },
  rating: {
    ...typography.small,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  city: {
    ...typography.tiny,
    textAlign: 'center',
    marginTop: 2,
  },
});
