import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import AppImage from '../common/AppImage';
import { colors, shadows, spacing, typography } from '../../theme';
import { parseProductMessage } from '../../utils/chatMessage';
import { formatTime } from '../../utils/formatters';

export default function MessageBubble({ message, isMine, onProductPress, fallbackProductId }) {
  const isRead = Boolean(message.isRead ?? message.read);
  const { product, text: displayContent } = parseProductMessage(message.content);
  const resolvedProduct = product ? { ...product, id: product.id ?? fallbackProductId } : null;
  const canOpenProduct = Boolean(resolvedProduct?.id && onProductPress);

  return (
    <View style={[styles.container, isMine ? styles.mineContainer : styles.theirContainer]}>
      <View style={[styles.bubble, product && styles.contextBubble, isMine ? styles.mineBubble : styles.theirBubble]}>
        {resolvedProduct ? (
          <TouchableOpacity
            activeOpacity={canOpenProduct ? 0.78 : 1}
            disabled={!canOpenProduct}
            onPress={() => onProductPress?.(resolvedProduct)}
            style={[styles.contextBox, isMine ? styles.mineContextBox : styles.theirContextBox]}
          >
            {resolvedProduct.imageUrl ? (
              <AppImage uri={resolvedProduct.imageUrl} style={styles.contextImage} fallbackEmoji="🛒" />
            ) : (
              <View style={[styles.contextIcon, isMine ? styles.mineContextIcon : styles.theirContextIcon]}>
                <Ionicons name="cube-outline" size={18} color={isMine ? colors.surface : colors.primary} />
              </View>
            )}
            <View style={styles.contextInfo}>
              <Text style={[styles.contextLabel, isMine ? styles.mineContextText : styles.theirContextText]}>
                Consulta sobre producto
              </Text>
              <Text style={[styles.contextTitle, isMine ? styles.mineContextText : styles.theirContextText]} numberOfLines={1}>
                {resolvedProduct.name ?? 'Publicación de producto'}
              </Text>
              {resolvedProduct.price != null ? (
                <Text style={[styles.contextMeta, isMine ? styles.mineContextMeta : styles.theirContextMeta]} numberOfLines={1}>
                  Q {Number(resolvedProduct.price).toFixed(2)} / {resolvedProduct.unit ?? 'u'}
                </Text>
              ) : (
                <Text style={[styles.contextMeta, isMine ? styles.mineContextMeta : styles.theirContextMeta]} numberOfLines={1}>
                  Publicación vinculada
                </Text>
              )}
            </View>
            {canOpenProduct ? (
              <Ionicons name="chevron-forward" size={16} color={isMine ? colors.surface : colors.textSecondary} />
            ) : null}
          </TouchableOpacity>
        ) : null}
        <Text style={[styles.content, isMine ? styles.mineText : styles.theirText]}>
          {displayContent}
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
  contextBubble: {
    width: '82%',
    maxWidth: 310,
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
  contextBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    padding: spacing.sm,
    borderRadius: 10,
    borderLeftWidth: 3,
    minHeight: 62,
  },
  mineContextBox: {
    borderLeftColor: colors.surface,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  theirContextBox: {
    borderLeftColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  contextImage: {
    width: 42,
    height: 42,
    borderRadius: 8,
  },
  contextIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  mineContextIcon: {
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  theirContextIcon: {
    backgroundColor: colors.surface,
  },
  contextInfo: {
    flex: 1,
    marginLeft: spacing.sm,
    minWidth: 0,
  },
  contextLabel: {
    ...typography.tiny,
    fontWeight: '800',
    marginBottom: 2,
  },
  contextTitle: {
    ...typography.small,
    fontWeight: '800',
    lineHeight: 18,
  },
  mineContextText: {
    color: colors.surface,
  },
  theirContextText: {
    color: colors.textPrimary,
  },
  contextMeta: {
    ...typography.tiny,
    marginTop: 1,
  },
  mineContextMeta: {
    color: 'rgba(255,255,255,0.78)',
  },
  theirContextMeta: {
    color: colors.textSecondary,
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
