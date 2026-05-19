import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import * as chatApi from '../../api/chatApi';
import { getProduct } from '../../api/productsApi';
import MessageBubble from '../../components/chat/MessageBubble';
import AppImage from '../../components/common/AppImage';
import FocusAwareStatusBar from '../../components/common/FocusAwareStatusBar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useToast } from '../../context/ToastContext';
import { colors, spacing, typography } from '../../theme';
import { formatPrice } from '../../utils/formatters';
import { getErrorMessage, getList, getPayload } from '../../utils/apiResponse';
import { PRODUCT_CONTEXT_PREFIX } from '../../utils/chatMessage';

const newestFirst = (items) => (
  [...items].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
);

const normalizeIncomingMessage = (payload) => {
  const message = payload?.data ?? payload?.message ?? payload;
  const createdAt = message?.createdAt ?? new Date().toISOString();

  return {
    ...message,
    id: message?.id ?? `${message?.senderId ?? 'sender'}-${createdAt}-${message?.content ?? ''}`,
    createdAt,
  };
};

export default function ChatScreen({ navigation, route }) {
  const {
    conversationId,
    otherUsername,
    productId,
    storeId,
    sellerId,
    buyerId,
    productContext,
    conversationType,
    returnToConversations,
  } = route.params;
  const { user } = useAuth();
  const { isConnected, subscribeToConversation, sendMessage, sendTyping, refreshUnreadCount } = useChat();
  const { showInfo, showError } = useToast();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [contextProduct, setContextProduct] = useState(productContext ?? null);
  const [contextAttached, setContextAttached] = useState(Boolean(productContext));
  const [resolvedStoreId, setResolvedStoreId] = useState(storeId ?? productContext?.storeId ?? null);
  const flatListRef = useRef(null);
  const typingTimerRef = useRef(null);
  const sendTypingTimerRef = useRef(null);

  const handleBack = () => {
    if (returnToConversations) {
      navigation.navigate('Conversations');
      return;
    }

    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate('Conversations');
  };

  const handleParticipantPress = () => {
    if (conversationType && conversationType !== 'PRODUCT') {
      return;
    }

    if (user?.role === 'SELLER' || Number(sellerId) === Number(user?.id)) {
      return;
    }

    if (resolvedStoreId) {
      navigation.navigate('StoreDetail', { storeId: resolvedStoreId });
      return;
    }

    if (contextProduct?.storeId) {
      navigation.navigate('StoreDetail', { storeId: contextProduct.storeId });
    }
  };

  const getParticipantSubtitle = () => {
    if (conversationType && conversationType !== 'PRODUCT') {
      return isConnected ? 'Contacto directo' : 'Conectando...';
    }

    if (user?.role === 'SELLER' || Number(sellerId) === Number(user?.id)) {
      return 'Comprador';
    }

    if (resolvedStoreId || contextProduct?.storeId || Number(sellerId) !== Number(user?.id)) {
      return 'Toca para ver la tienda';
    }

    if (buyerId) {
      return 'Comprador';
    }

    return isConnected ? 'Conectado' : 'Conectando...';
  };

  const handleProductPress = async (product) => {
    if (!product?.id) {
      showInfo('Publicacion de producto no disponible.');
      return;
    }

    try {
      const response = await getProduct(product.id);
      const latestProduct = getPayload(response);
      const isUnavailable = latestProduct?.active === false
        || latestProduct?.status === 'DELETED'
        || Number(latestProduct?.stock ?? 1) <= 0;

      if (isUnavailable) {
        showInfo('Publicacion de producto agotado o no disponible.');
        return;
      }

      navigation.navigate('ProductDetail', { productId: product.id });
    } catch (productError) {
      showInfo('Publicacion de producto agotado o no disponible.');
    }
  };

  const scrollToNewest = () => {
    requestAnimationFrame(() => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    });
  };

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    setError('');

    try {
      const response = await chatApi.getMessages(conversationId, { page: 0, size: 30 });
      setMessages(newestFirst(getList(response)));
      refreshUnreadCount();
      scrollToNewest();
    } catch (historyError) {
      setError(getErrorMessage(historyError, 'No pudimos cargar la conversación.'));
    } finally {
      setLoadingHistory(false);
    }
  }, [conversationId, refreshUnreadCount]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    if (productContext || !productId) {
      return;
    }

    let mounted = true;

    const loadProductContext = async () => {
      try {
        const response = await getProduct(productId);
        const product = getPayload(response);
        const store = product?.store ?? {};

        if (!mounted) return;

        setContextProduct({
          id: product.id,
          name: product.name,
          imageUrl: product.imageUrl ?? product.mainImageUrl ?? product.images?.[0]?.url ?? null,
          price: product.price,
          unit: product.unit,
          storeId: store.id ?? product.storeId,
          storeName: store.name ?? product.storeName,
        });
        setResolvedStoreId(store.id ?? product.storeId ?? null);
      } catch (loadError) {
        setContextProduct(null);
      }
    };

    loadProductContext();

    return () => {
      mounted = false;
    };
  }, [productContext, productId]);

  useEffect(() => {
    if (!isConnected) {
      return undefined;
    }

    const unsubscribe = subscribeToConversation(
      conversationId,
      (newMessage) => {
        const confirmedMessage = normalizeIncomingMessage(newMessage);
        setMessages((current) => {
          const filtered = current.filter((message) => !(
            Number(message.id) < 0
            && message.content === confirmedMessage.content
            && (
              Number(message.senderId) === Number(confirmedMessage.senderId)
              || Number(message.senderId) === Number(user?.id)
              || confirmedMessage.senderId == null
            )
          ));

          if (filtered.some((message) => String(message.id) === String(confirmedMessage.id))) {
            return filtered;
          }

          return [confirmedMessage, ...filtered];
        });
        refreshUnreadCount();
        scrollToNewest();
      },
      (typingData) => {
        if (typingData?.username && typingData.username === user?.username) {
          return;
        }

        setIsTyping(true);
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => setIsTyping(false), 2000);
      }
    );

    return () => {
      unsubscribe();
      clearTimeout(typingTimerRef.current);
      clearTimeout(sendTypingTimerRef.current);
    };
  }, [conversationId, isConnected, refreshUnreadCount, subscribeToConversation, user?.id, user?.username]);

  const handleChangeText = (value) => {
    setInputText(value);
    clearTimeout(sendTypingTimerRef.current);
    sendTypingTimerRef.current = setTimeout(() => sendTyping(conversationId), 500);
  };

  const handleSend = async () => {
    const rawContent = inputText.trim();

    if (!rawContent || sending) {
      return;
    }

    if (!isConnected) {
      setError('Conectando al chat. Espera unos segundos e intenta de nuevo.');
      return;
    }

    setSending(true);
    setInputText('');
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const content = contextAttached && contextProduct
      ? `${PRODUCT_CONTEXT_PREFIX}${JSON.stringify({
        id: contextProduct.id,
        name: contextProduct.name,
        imageUrl: contextProduct.imageUrl,
        price: contextProduct.price,
        unit: contextProduct.unit,
      })}\n${rawContent}`
      : rawContent;

    const optimisticMessage = {
      id: -Date.now(),
      optimistic: true,
      conversationId,
      senderId: user?.id,
      senderUsername: user?.username,
      content,
      createdAt: new Date().toISOString(),
      isRead: false,
    };

    const delivered = sendMessage(conversationId, content);

    if (!delivered) {
      setError('Sin conexión al chat. Intenta de nuevo en un momento.');
      setInputText(rawContent);
      setSending(false);
      return;
    }

    setMessages((current) => [optimisticMessage, ...current]);
    setContextAttached(false);
    scrollToNewest();
    setError('');
    setSending(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <FocusAwareStatusBar style="dark" backgroundColor="transparent" translucent />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity activeOpacity={0.8} onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.78} onPress={handleParticipantPress} style={styles.avatar}>
            <Text style={styles.avatarText}>{otherUsername?.charAt(0)?.toUpperCase() ?? 'T'}</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.78} onPress={handleParticipantPress} style={styles.headerText}>
            <Text style={styles.otherName} numberOfLines={1}>{otherUsername}</Text>
            <Text style={styles.productText}>{getParticipantSubtitle()}</Text>
          </TouchableOpacity>
          <View style={[styles.connectionDot, { backgroundColor: isConnected ? colors.success : colors.textLight }]} />
        </View>

        {error ? (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle" size={18} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity activeOpacity={0.75} onPress={loadHistory}>
              <Text style={styles.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {loadingHistory ? (
          <View style={styles.loadingWrap}>
            <LoadingSpinner />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            inverted
            keyExtractor={(item, index) => `${item.id ?? item.createdAt ?? 'message'}-${index}`}
            contentContainerStyle={styles.messagesContent}
            renderItem={({ item }) => (
              <MessageBubble
                message={item}
                isMine={Number(item.senderId) === Number(user?.id)}
                onProductPress={handleProductPress}
                fallbackProductId={productId}
              />
            )}
            ListHeaderComponent={isTyping ? <TypingIndicator /> : null}
          />
        )}

        <View style={styles.inputWrap}>
          {contextAttached && contextProduct ? (
            <View style={styles.productContextCard}>
              <AppImage uri={contextProduct.imageUrl} style={styles.contextImage} fallbackEmoji="🛒" />
              <View style={styles.contextBody}>
                <Text style={styles.contextEyebrow}>Consulta sobre este producto</Text>
                <Text style={styles.contextName} numberOfLines={1}>{contextProduct.name}</Text>
                <Text style={styles.contextPrice}>
                  {formatPrice(contextProduct.price)} / {contextProduct.unit ?? 'u'}
                </Text>
              </View>
              <TouchableOpacity activeOpacity={0.75} onPress={() => setContextAttached(false)} style={styles.contextClose}>
                <Ionicons name="close" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={styles.inputBar}>
          <TextInput
            value={inputText}
            onChangeText={handleChangeText}
            placeholder={isConnected ? 'Escribe un mensaje...' : 'Conectando al chat...'}
            placeholderTextColor={colors.textLight}
            multiline
            style={styles.input}
          />
          <TouchableOpacity
            activeOpacity={0.85}
            disabled={!inputText.trim() || !isConnected || sending}
            onPress={handleSend}
            style={[styles.sendButton, inputText.trim() && isConnected ? styles.sendButtonActive : styles.sendButtonDisabled]}
          >
            <Ionicons name="send" size={20} color={colors.surface} />
          </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function TypingIndicator() {
  const dotOne = useRef(new Animated.Value(0.3)).current;
  const dotTwo = useRef(new Animated.Value(0.3)).current;
  const dotThree = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const createAnimation = (value, delay) => Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(value, { toValue: 1, duration: 260, useNativeDriver: true }),
        Animated.timing(value, { toValue: 0.3, duration: 260, useNativeDriver: true }),
      ])
    );

    const animations = [
      createAnimation(dotOne, 0),
      createAnimation(dotTwo, 120),
      createAnimation(dotThree, 240),
    ];

    animations.forEach((animation) => animation.start());
    return () => animations.forEach((animation) => animation.stop());
  }, [dotOne, dotThree, dotTwo]);

  return (
    <View style={styles.typingWrap}>
      <View style={styles.typingBubble}>
        {[dotOne, dotTwo, dotThree].map((dot, index) => (
          <Animated.View key={index} style={[styles.typingDot, { opacity: dot }]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  avatar: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: colors.accent,
    marginLeft: spacing.xs,
  },
  avatarText: {
    ...typography.bodyBold,
    color: colors.surface,
  },
  headerText: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  otherName: {
    ...typography.h3,
  },
  productText: {
    ...typography.tiny,
    marginTop: 2,
  },
  connectionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesContent: {
    paddingVertical: spacing.md,
  },
  inputWrap: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  productContextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.sm,
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  contextImage: {
    width: 46,
    height: 46,
    borderRadius: 8,
  },
  contextBody: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  contextEyebrow: {
    ...typography.tiny,
    color: colors.primary,
    fontWeight: '800',
  },
  contextName: {
    ...typography.small,
    color: colors.textPrimary,
    fontWeight: '800',
    marginTop: 1,
  },
  contextPrice: {
    ...typography.tiny,
    color: colors.textSecondary,
    marginTop: 1,
  },
  contextClose: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: spacing.sm,
  },
  input: {
    ...typography.body,
    flex: 1,
    maxHeight: 100,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.background,
  },
  sendButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  sendButtonActive: {
    backgroundColor: colors.primary,
  },
  sendButtonDisabled: {
    backgroundColor: colors.textLight,
  },
  typingWrap: {
    alignItems: 'flex-start',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    backgroundColor: colors.surface,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textSecondary,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    margin: spacing.md,
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
});
