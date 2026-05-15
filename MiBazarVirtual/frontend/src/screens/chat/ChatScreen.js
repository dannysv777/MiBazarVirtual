import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import * as chatApi from '../../api/chatApi';
import MessageBubble from '../../components/chat/MessageBubble';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { colors, spacing, typography } from '../../theme';
import { getErrorMessage, getList } from '../../utils/apiResponse';

const sortMessages = (items) => [...items].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

export default function ChatScreen({ navigation, route }) {
  const { conversationId, otherUsername, productId } = route.params;
  const { user } = useAuth();
  const { isConnected, subscribeToConversation, sendMessage, sendTyping, refreshUnreadCount } = useChat();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const typingTimerRef = useRef(null);
  const sendTypingTimerRef = useRef(null);

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    setError('');

    try {
      const response = await chatApi.getMessages(conversationId, { page: 0, size: 30 });
      setMessages(sortMessages(getList(response)));
      refreshUnreadCount();
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
    if (!isConnected) {
      return undefined;
    }

    const unsubscribe = subscribeToConversation(
      conversationId,
      (newMessage) => {
        setMessages((current) => {
          const withoutOptimistic = current.filter((message) => !(
            String(message.id).startsWith('temp-')
            && message.content === newMessage.content
            && Number(message.senderId) === Number(user?.id)
          ));

          if (withoutOptimistic.some((message) => String(message.id) === String(newMessage.id))) {
            return withoutOptimistic;
          }

          return sortMessages([...withoutOptimistic, newMessage]);
        });
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
  }, [conversationId, isConnected, subscribeToConversation, user?.id, user?.username]);

  const listData = useMemo(() => [...messages].reverse(), [messages]);

  const handleChangeText = (value) => {
    setInputText(value);
    clearTimeout(sendTypingTimerRef.current);
    sendTypingTimerRef.current = setTimeout(() => sendTyping(conversationId), 500);
  };

  const handleSend = async () => {
    const content = inputText.trim();

    if (!content || sending) {
      return;
    }

    setSending(true);
    setInputText('');
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      conversationId,
      senderId: user?.id,
      senderUsername: user?.username,
      content,
      createdAt: new Date().toISOString(),
      isRead: false,
    };

    setMessages((current) => sortMessages([...current, optimisticMessage]));

    const delivered = sendMessage(conversationId, content);

    if (!delivered) {
      setError('Sin conexión al chat. Intenta de nuevo en un momento.');
    }

    setSending(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{otherUsername?.charAt(0)?.toUpperCase() ?? 'T'}</Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.otherName} numberOfLines={1}>{otherUsername}</Text>
            <Text style={styles.productText}>Producto #{productId}</Text>
          </View>
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
            data={listData}
            inverted
            keyExtractor={(item, index) => `${item.id ?? item.createdAt ?? 'message'}-${index}`}
            contentContainerStyle={styles.messagesContent}
            renderItem={({ item }) => (
              <MessageBubble message={item} isMine={Number(item.senderId) === Number(user?.id)} />
            )}
            ListHeaderComponent={isTyping ? <TypingIndicator /> : null}
          />
        )}

        <View style={styles.inputBar}>
          <TextInput
            value={inputText}
            onChangeText={handleChangeText}
            placeholder="Escribe un mensaje..."
            placeholderTextColor={colors.textLight}
            multiline
            style={styles.input}
          />
          <TouchableOpacity
            activeOpacity={0.85}
            disabled={!inputText.trim()}
            onPress={handleSend}
            style={[styles.sendButton, inputText.trim() ? styles.sendButtonActive : styles.sendButtonDisabled]}
          >
            <Ionicons name="send" size={20} color={colors.surface} />
          </TouchableOpacity>
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
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
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
