import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import * as ordersApi from '../../api/ordersApi';
import AppImage from '../../components/common/AppImage';
import EmptyState from '../../components/common/EmptyState';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import CategoryChip from '../../components/home/CategoryChip';
import ProductCard from '../../components/home/ProductCard';
import SearchBar from '../../components/home/SearchBar';
import StoreCard from '../../components/home/StoreCard';
import { getCategories } from '../../api/categoriesApi';
import { getProducts } from '../../api/productsApi';
import { getStores } from '../../api/storesApi';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useChat } from '../../context/ChatContext';
import { useToast } from '../../context/ToastContext';
import { colors, spacing, typography } from '../../theme';
import { formatPrice } from '../../utils/formatters';
import { getFirstName, getGreeting } from '../../utils/greeting';
import { analyzeOrderHistory, getRecommendedCategoryIds } from '../../utils/recommendations';
import { getErrorMessage, getList } from '../../utils/apiResponse';
import { scale } from '../../utils/responsive';

const allCategory = { id: 0, name: 'Todos', icon: '✨' };

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const { unreadCount } = useChat();
  const { showSuccess } = useToast();
  const [greeting, setGreeting] = useState(getGreeting());
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [frequentItems, setFrequentItems] = useState([]);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [compactStatusBar, setCompactStatusBar] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  const isBuyer = user?.role === 'BUYER';
  const firstName = getFirstName(user?.fullName) || user?.username || 'Invitado';

  useFocusEffect(useCallback(() => {
    setGreeting(getGreeting());
  }, []));

  const loadHomeData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');

    try {
      const [categoriesResponse, productsResponse, storesResponse, ordersResult] = await Promise.allSettled([
        getCategories(),
        getProducts({ page: 0, size: 10 }),
        getStores({ page: 0, size: 6 }),
        isBuyer && isAuthenticated ? ordersApi.getOrderHistory() : Promise.resolve(null),
      ]);

      if (categoriesResponse.status === 'fulfilled') {
        setCategories([allCategory, ...getList(categoriesResponse.value)]);
      }

      if (productsResponse.status === 'fulfilled') {
        setProducts(getList(productsResponse.value));
      }

      if (storesResponse.status === 'fulfilled') {
        setStores(getList(storesResponse.value));
      }

      if (ordersResult.status === 'fulfilled' && ordersResult.value) {
        const orders = getList(ordersResult.value);
        const frequent = analyzeOrderHistory(orders);
        setFrequentItems(frequent);

        const categoryIds = getRecommendedCategoryIds(orders);
        if (categoryIds.length) {
          const recommendedResponse = await getProducts({ categoryId: categoryIds[0], page: 0, size: 6 });
          const weeklyIds = new Set(frequent.map((item) => item.productId));
          setRecommendedProducts(getList(recommendedResponse).filter((item) => !weeklyIds.has(item.id)));
        } else {
          setRecommendedProducts([]);
        }
      } else {
        setFrequentItems([]);
        setRecommendedProducts([]);
      }

      if (
        categoriesResponse.status === 'rejected'
        && productsResponse.status === 'rejected'
        && storesResponse.status === 'rejected'
      ) {
        throw productsResponse.reason;
      }
    } catch (homeError) {
      setError(getErrorMessage(homeError, 'No pudimos cargar el inicio.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated, isBuyer]);

  useEffect(() => {
    loadHomeData();
  }, [loadHomeData]);

  const goToProducts = (params = {}) => {
    navigation.navigate('ProductList', params);
  };

  const addFrequentItems = () => {
    frequentItems.forEach((item) => addItem({
      id: item.productId,
      name: item.name,
      imageUrl: item.imageUrl,
      price: item.price,
      unit: item.unit,
      store: { id: item.storeId, name: item.storeName },
    }, Number(item.defaultQuantity ?? 1), { silent: true }));
    showSuccess(`${frequentItems.length} productos agregados al carrito`);
  };

  const refreshControl = useMemo(() => (
    <RefreshControl
      tintColor={colors.primary}
      colors={[colors.primary]}
      refreshing={refreshing}
      onRefresh={() => loadHomeData(true)}
    />
  ), [loadHomeData, refreshing]);

  const compactHeaderOpacity = scrollY.interpolate({
    inputRange: [30, 95],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const headerContentOpacity = scrollY.interpolate({
    inputRange: [0, 52, 96],
    outputRange: [1, 0.25, 0],
    extrapolate: 'clamp',
  });

  return (
    <SafeAreaView edges={['left', 'right']} style={styles.safeArea}>
      <StatusBar style={compactStatusBar ? 'light' : 'dark'} backgroundColor="transparent" translucent />
      <Animated.ScrollView
        refreshControl={refreshControl}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          {
            useNativeDriver: true,
            listener: (event) => {
              const nextCompact = event.nativeEvent.contentOffset.y > 72;
              setCompactStatusBar((current) => (current === nextCompact ? current : nextCompact));
            },
          }
        )}
      >
        <Animated.View style={[styles.header, { paddingTop: insets.top + spacing.md, opacity: headerContentOpacity }]}>
          <View>
            <Text style={styles.greeting}>{greeting.text} {greeting.emoji}</Text>
            <Text style={styles.userName}>{firstName}</Text>
          </View>
          <TouchableOpacity activeOpacity={0.8} style={styles.bellButton} onPress={() => navigation.navigate('Notifications')}>
            <Ionicons name="notifications-outline" size={26} color={colors.textPrimary} />
            {unreadCount > 0 ? (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.searchWrap}>
          <SearchBar editable={false} onPress={() => goToProducts()} />
        </View>

        <LinearGradient colors={[colors.secondary, colors.primary]} style={styles.banner}>
          <Text style={styles.bannerTitle}>🥦 Productos frescos</Text>
          <Text style={styles.bannerSubtitle}>Directo del mercado a tu puerta</Text>
        </LinearGradient>

        {error ? (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle" size={20} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity activeOpacity={0.75} onPress={() => loadHomeData()}>
              <Text style={styles.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <SectionHeader title="Categorías" actionLabel="Ver todas" onAction={() => goToProducts({ title: 'Categorías' })} />
        {loading ? (
          <SkeletonRow height={38} />
        ) : (
          <FlatList
            data={categories}
            horizontal
            keyExtractor={(item) => item.id.toString()}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => (
              <CategoryChip
                category={item}
                onPress={() => goToProducts(item.id === 0 ? {} : { categoryId: item.id, title: item.name })}
              />
            )}
          />
        )}

        {isBuyer ? (
          <WeeklySection
            loading={loading}
            frequentItems={frequentItems}
            onAddAll={addFrequentItems}
            onOpen={() => navigation.navigate('WeeklyPurchase')}
            onBrowse={() => goToProducts()}
          />
        ) : null}

        <SectionHeader title="Productos destacados" />
        {loading ? (
          <CardSkeletonRow />
        ) : products.length ? (
          <FlatList
            data={products}
            horizontal
            keyExtractor={(item) => item.id.toString()}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => (
              <ProductCard product={item} onPress={() => navigation.navigate('ProductDetail', { productId: item.id })} />
            )}
          />
        ) : (
          <EmptyState emoji="🍽️" title="Sin productos" subtitle="Aún no hay productos destacados." />
        )}

        {isBuyer && recommendedProducts.length ? (
          <>
            <SectionHeader title="Recomendado para ti ✨" subtitle="Basado en tus compras anteriores" />
            <FlatList
              data={recommendedProducts}
              horizontal
              keyExtractor={(item) => item.id.toString()}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              renderItem={({ item }) => (
                <ProductCard product={item} onPress={() => navigation.navigate('ProductDetail', { productId: item.id })} />
              )}
            />
          </>
        ) : null}

        <SectionHeader title="Tiendas" />
        {loading ? (
          <StoreSkeletonRow />
        ) : stores.length ? (
          <FlatList
            data={stores}
            horizontal
            keyExtractor={(item) => item.id.toString()}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => (
              <StoreCard store={item} onPress={() => navigation.navigate('StoreDetail', { storeId: item.id })} />
            )}
          />
        ) : (
          <EmptyState emoji="🏪" title="Sin tiendas" subtitle="Pronto verás tiendas disponibles." />
        )}
      </Animated.ScrollView>

      <Animated.View
        pointerEvents="box-none"
        style={[
          styles.compactHeader,
          {
            height: insets.top + 38,
            opacity: compactHeaderOpacity,
          },
        ]}
      >
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(27,67,50,0.92)', 'rgba(27,67,50,0.5)', 'rgba(27,67,50,0)']}
          locations={[0, 0.5, 1]}
          style={styles.compactHeaderGradient}
        />
      </Animated.View>
    </SafeAreaView>
  );
}

function SectionHeader({ title, subtitle, actionLabel, onAction }) {
  return (
    <View style={styles.sectionHeader}>
      <View>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      {actionLabel ? (
        <TouchableOpacity onPress={onAction} activeOpacity={0.7}>
          <Text style={styles.sectionAction}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function WeeklySection({ loading, frequentItems, onAddAll, onOpen, onBrowse }) {
  if (loading) {
    return (
      <>
        <SectionHeader title="Tu compra semanal" />
        <SkeletonRow height={80} />
      </>
    );
  }

  if (!frequentItems.length) {
    return (
      <>
        <SectionHeader title="Tu compra semanal" />
        <View style={styles.weeklyEmptyCard}>
          <Text style={styles.weeklyEmoji}>🛒</Text>
          <View style={styles.weeklyEmptyText}>
            <Text style={styles.weeklyEmptyTitle}>Aún no tienes compras frecuentes</Text>
            <Text style={styles.weeklyEmptySubtitle}>Haz tu primer pedido y te recomendaremos automáticamente.</Text>
          </View>
          <TouchableOpacity activeOpacity={0.8} onPress={onBrowse} style={styles.weeklySmallButton}>
            <Text style={styles.weeklySmallButtonText}>Ver productos</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  return (
    <>
      <SectionHeader title="Tu compra semanal" />
      <FlatList
        data={frequentItems}
        horizontal
        keyExtractor={(item) => item.productId.toString()}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalList}
        renderItem={({ item }) => (
          <View style={styles.frequentCard}>
            <AppImage uri={item.imageUrl} style={styles.frequentImage} fallbackEmoji="🛒" />
            <Text style={styles.frequentName} numberOfLines={2}>{item.name}</Text>
            <Text style={styles.frequentPrice}>{formatPrice(item.price)}</Text>
          </View>
        )}
      />
      <View style={styles.weeklyFooter}>
        <TouchableOpacity activeOpacity={0.75} onPress={onOpen}>
          <Text style={styles.weeklyLink}>Ver lista completa →</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.8} onPress={onAddAll} style={styles.weeklySmallButton}>
          <Text style={styles.weeklySmallButtonText}>Agregar todo</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

function SkeletonRow({ height }) {
  return (
    <View style={styles.skeletonRow}>
      <SkeletonLoader width={94} height={height} borderRadius={20} />
      <SkeletonLoader width={110} height={height} borderRadius={20} />
      <SkeletonLoader width={82} height={height} borderRadius={20} />
    </View>
  );
}

function CardSkeletonRow() {
  return (
    <View style={styles.skeletonRow}>
      <SkeletonLoader width={scale(160)} height={scale(200)} borderRadius={16} />
      <SkeletonLoader width={scale(160)} height={scale(200)} borderRadius={16} />
      <SkeletonLoader width={scale(160)} height={scale(200)} borderRadius={16} />
    </View>
  );
}

function StoreSkeletonRow() {
  return (
    <View style={styles.skeletonRow}>
      <SkeletonLoader width={scale(160)} height={scale(180)} borderRadius={16} />
      <SkeletonLoader width={scale(160)} height={scale(180)} borderRadius={16} />
      <SkeletonLoader width={scale(160)} height={scale(180)} borderRadius={16} />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    paddingBottom: 72,
  },
  compactHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 86,
  },
  compactHeaderGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  greeting: {
    ...typography.small,
  },
  userName: {
    ...typography.h3,
    marginTop: 2,
  },
  bellButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: colors.background,
  },
  unreadBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    backgroundColor: colors.error,
    paddingHorizontal: 3,
  },
  unreadBadgeText: {
    ...typography.tiny,
    color: colors.surface,
    fontWeight: '700',
  },
  searchWrap: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  banner: {
    height: scale(130),
    justifyContent: 'center',
    borderRadius: scale(16),
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  bannerTitle: {
    ...typography.h3,
    color: colors.surface,
  },
  bannerSubtitle: {
    ...typography.small,
    color: colors.surface,
    marginTop: spacing.xs,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.bodyBold,
  },
  sectionSubtitle: {
    ...typography.small,
    marginTop: 2,
  },
  sectionAction: {
    ...typography.small,
    color: colors.primary,
    fontWeight: '700',
  },
  horizontalList: {
    paddingHorizontal: spacing.md,
  },
  skeletonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
  },
  weeklyEmptyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    padding: spacing.md,
    borderRadius: scale(12),
    backgroundColor: colors.background,
  },
  weeklyEmoji: {
    fontSize: 30,
  },
  weeklyEmptyText: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  weeklyEmptyTitle: {
    ...typography.bodyBold,
  },
  weeklyEmptySubtitle: {
    ...typography.tiny,
    marginTop: 2,
  },
  weeklySmallButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: scale(18),
    backgroundColor: colors.primary,
  },
  weeklySmallButtonText: {
    ...typography.tiny,
    color: colors.surface,
    fontWeight: '700',
  },
  frequentCard: {
    width: scale(110),
    marginRight: spacing.sm,
    padding: spacing.sm,
    borderRadius: scale(12),
    backgroundColor: colors.background,
  },
  frequentImage: {
    width: '100%',
    height: scale(70),
    borderRadius: scale(12),
    marginBottom: spacing.xs,
  },
  frequentName: {
    ...typography.tiny,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  frequentPrice: {
    ...typography.tiny,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  weeklyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  weeklyLink: {
    ...typography.small,
    color: colors.primary,
    fontWeight: '700',
  },
});
