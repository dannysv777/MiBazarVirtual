import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../../theme';
import AppButton from './AppButton';

export default function EmptyState({ emoji, title, subtitle, actionLabel, onAction }) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {actionLabel ? (
        <View style={styles.action}>
          <AppButton title={actionLabel} onPress={onAction} variant="outline" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  emoji: {
    fontSize: 56,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h3,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.small,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  action: {
    marginTop: spacing.md,
  },
});
