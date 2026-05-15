import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, shadows, spacing, typography } from '../../theme';

const formatTime = (date) => (
  new Date(date).toLocaleTimeString('es-GT', {
    hour: '2-digit',
    minute: '2-digit',
  })
);

export default function MessageBubble({ message, isMine }) {
  const isRead = Boolean(message.isRead ?? message.read);

  return (
    <View style={[styles.container, isMine ? styles.mineContainer : styles.theirContainer]}>
      <View style={[styles.bubble, isMine ? styles.mineBubble : styles.theirBubble]}>
        <Text style={[styles.content, isMine ? styles.mineText : styles.theirText]}>
          {message.content}
        </Text>
        <View style={styles.metaRow}>
          <Text style={[styles.time, isMine ? styles.mineTime : styles.theirTime]}>
            {formatTime(message.createdAt ?? Date.now())}
          </Text>
          {isMine ? (
            <Ionicons
              name={isRead ? 'checkmark-done' : 'checkmark'}
              size={14}
              color="rgba(255,255,255,0.82)"
              style={styles.readIcon}
            />
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  mineContainer: {
    alignItems: 'flex-end',
  },
  theirContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  mineBubble: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    ...shadows.card,
  },
  content: {
    ...typography.body,
    lineHeight: 21,
  },
  mineText: {
    color: colors.surface,
  },
  theirText: {
    color: colors.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: spacing.xs,
  },
  time: {
    ...typography.tiny,
  },
  mineTime: {
    color: 'rgba(255,255,255,0.72)',
  },
  theirTime: {
    color: colors.textLight,
  },
  readIcon: {
    marginLeft: spacing.xs,
  },
});
