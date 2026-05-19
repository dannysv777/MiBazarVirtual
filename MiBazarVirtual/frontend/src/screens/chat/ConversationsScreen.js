import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import * as chatApi from '../../api/chatApi';
import EmptyState from '../../components/common/EmptyState';
import FocusAwareStatusBar from '../../components/common/FocusAwareStatusBar';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { colors, shadows, spacing, typography } from '../../theme';
import { getErrorMessage, getList } from '../../utils/apiResponse';
import { getChatPreviewText } from '../../utils/chatMessage';
import { formatRelativeTime } from '../../utils/formatters';

const getOtherName = (conversation) => (
  conversation.otherParticipantUsername ?? conversation.otherUsername ?? conversation.sellerUsername ?? 'Tienda'
);

const getConversationGroupKey = (conversation, user) => {
  if (conversation.conversationType && conversation.conversationType !== 'PRODUCT') {
    return `direct-${conversation.buyerId}-${conversation.sellerId}-${conversation.orderId ?? 'general'}`;
  }

  if (user?.role === 'BUYER') {
    return `seller-${conversation.sellerId ?? getOtherName(conversation)}`;
  }

  if (user?.role === 'SELLER') {
    return `buyer-${conversation.buyerId ?? getOtherName(conversation)}`;
  }

  return `${conversation.buyerId ?? 'buyer'}-${conversation.sellerId ?? getOtherName(conversation)}`;
};

const getConversationTime = (conversation) => (
  new Date(conversation.lastMessageTime ?? conversation.updatedAt ?? 0).getTime()
);

const groupConversationsByParticipant = (items, user) => {
  const grouped = new Map();

  items.forEach((conversation) => {
    const key = getConversationGroupKey(conversation, user);
    const current = grouped.get(key);

    if (!current || getConversationTime(conversation) > getConversationTime(current)) {
      grouped.set(key, conversation);
    }
  });

  return [...grouped.values()].sort((a, b) => getConversationTime(b) - getConversationTime(a));
};

export default function ConversationsScreen({ navigation }) {
  const { user } = useAuth();
  const { unreadCount, refreshUnreadCount } = useChat();
  const [conversations, setConversations] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadConversations = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');

    try {
      const response = await chatApi.getConversations();
      setConversations(groupConversationsByParticipant(getList(response), user));
      refreshUnreadCount();
    } catch (conversationError) {
      setError(getErrorMessage(conversationError, 'No pudimos cargar tus mensajes.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshUnreadCount, user]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useFocusEffect(
    useCallback(() => {
      loadConversations(true);
    }, [loadConversations])
  );

  const filteredConversations = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return conversations;
    }

    return conversations.filter((conversation) => (
      getOtherName(conversation).toLowerCase().includes(normalized)
    ));
  }, [conversations, query]);

  const renderConversation = ({ item }) => {
    const otherUsername = getOtherName(item);
    const unread = Number(item.unreadCount ?? 0);

    return (
      <TouchableOpacity
        activeOpacity={0.86}
        style={styles.conversationCard}
        onPress={() => navigation.navigate('Chat', {
          conversationId: item.id,
          otherUsername,
          productId: item.productId,
          sellerId: item.sellerId,
          buyerId: item.buyerId,
          conversationType: item.conversationType,
          orderId: item.orderId,
          returnToConversations: true,
        })}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{otherUsername.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.conversationBody}>
          <View style={styles.conversationTop}>
            <Text style={styles.otherName} numberOfLines={1}>{otherUsername}</Text>
            <Text style={styles.time}>{formatRelativeTime(item.lastMessageTime ?? item.updatedAt)}</Text>
          </View>
          <Text style={styles.preview} numberOfLines={1}>
            {item.lastMessage ? getChatPreviewText(item.lastMessage) : 'Sin mensajes todavía'}
          </Text>
        </View>
        {unread > 0 ? (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{unread > 99 ? '99+' : unread}</Text>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <FocusAwareStatusBar style="dark" backgroundColor="transparent" translucent />
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Mensajes</Text>
          {unreadCount > 0 ? (
            <Text style={styles.unreadSummary}>{unreadCount} sin leer</Text>
          ) : (
            <Text style={styles.subtitle}>
              {user?.role === 'SELLER'
                ? 'Conversaciones con compradores y delivery'
                : user?.role === 'DELIVERY'
                  ? 'Conversaciones con clientes y vendedores'
                  : 'Conversaciones con vendedores y delivery'}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={colors.textSecondary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar conversación"
          placeholderTextColor={colors.textLight}
          style={styles.searchInput}
        />
      </View>

      {error ? (
        <View style={styles.errorCard}>
          <Ionicons name="alert-circle" size={20} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity activeOpacity={0.75} onPress={() => loadConversations()}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {loading ? (
        <ConversationSkeleton />
      ) : (
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={(
            <RefreshControl
              tintColor={colors.primary}
              colors={[colors.primary]}
              refreshing={refreshing}
              onRefresh={() => loadConversations(true)}
            />
          )}
          contentContainerStyle={styles.listContent}
          renderItem={renderConversation}
          ListEmptyComponent={(
            <EmptyState
              emoji="💬"
              title="Sin mensajes aún"
              subtitle="Inicia una conversación desde el detalle de un producto."
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

function ConversationSkeleton() {
  return (
    <View style={styles.skeletonList}>
      {[0, 1, 2, 3].map((item) => (
        <View key={item} style={styles.skeletonCard}>
          <SkeletonLoader width={48} height={48} borderRadius={24} />
          <View style={styles.skeletonText}>
            <SkeletonLoader width="55%" height={18} borderRadius={9} />
            <SkeletonLoader width="78%" height={14} borderRadius={7} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    ...typography.h2,
  },
  subtitle: {
    ...typography.small,
    marginTop: spacing.xs,
  },
  unreadSummary: {
    ...typography.small,
    color: colors.primary,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 46,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 23,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  searchInput: {
    ...typography.body,
    flex: 1,
    marginLeft: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 78,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  avatar: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: colors.accent,
  },
  avatarText: {
    ...typography.h3,
    color: colors.surface,
  },
  conversationBody: {
    flex: 1,
    marginLeft: spacing.md,
  },
  conversationTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  otherName: {
    ...typography.bodyBold,
    flex: 1,
    marginRight: spacing.sm,
  },
  time: {
    ...typography.tiny,
    color: colors.textLight,
  },
  preview: {
    ...typography.small,
    marginTop: spacing.xs,
  },
  unreadBadge: {
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xs,
    marginLeft: spacing.sm,
  },
  unreadText: {
    ...typography.tiny,
    color: colors.surface,
    fontWeight: '700',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: '#FFE9E8',
  },
  errorText: {
    ...typography.small,
    flex: 1,
    color: colors.error,
  },
  retryText: {
    ...typography.small,
    color: colors.error,
    fontWeight: '700',
  },
  skeletonList: {
    padding: spacing.md,
  },
  skeletonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  skeletonText: {
    flex: 1,
    gap: spacing.sm,
    marginLeft: spacing.md,
  },
});
