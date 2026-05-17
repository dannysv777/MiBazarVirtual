import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../../theme';
import { isStoreOpen } from '../../utils/storeSchedule';

export default function StoreStatusBadge({ schedule, compact = false }) {
  const status = isStoreOpen(schedule);
  const isUnknown = status.isOpen === null;

  if (compact) {
    return (
      <View style={[
        styles.compactBadge,
        status.isOpen ? styles.compactOpen : styles.compactClosed,
        isUnknown && styles.compactUnknown,
      ]}
      >
        <Text style={[
          styles.compactText,
          status.isOpen ? styles.openText : styles.closedText,
          isUnknown && styles.unknownText,
        ]}
        >
          {status.statusText}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: status.color }]} />
      <Text style={[styles.statusText, { color: status.color }]}>{status.statusText}</Text>
      {status.detailText ? (
        <>
          <Text style={styles.separator}> - </Text>
          <Text style={styles.detailText}>{status.detailText}</Text>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  statusText: {
    ...typography.small,
    fontWeight: '800',
  },
  separator: {
    ...typography.small,
    color: colors.textLight,
  },
  detailText: {
    ...typography.small,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  compactBadge: {
    alignSelf: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 999,
  },
  compactOpen: {
    backgroundColor: 'rgba(52,199,89,0.15)',
  },
  compactClosed: {
    backgroundColor: 'rgba(255,59,48,0.13)',
  },
  compactUnknown: {
    backgroundColor: colors.background,
  },
  compactText: {
    ...typography.tiny,
    fontWeight: '800',
  },
  openText: {
    color: colors.success,
  },
  closedText: {
    color: colors.error,
  },
  unknownText: {
    color: colors.textSecondary,
  },
});
