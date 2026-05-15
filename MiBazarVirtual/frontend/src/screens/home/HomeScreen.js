import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

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
import { useChat } from '../../context/ChatContext';
import { colors, spacing, typography } from '../../theme';
import { getErrorMessage, getList } from '../../utils/apiResponse';

const allCategory = { id: 0, name: 'Todos', icon: '✨' };

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { unreadCount } = useChat();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadHomeData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');

    try {
      const [categoriesResponse, productsResponse, storesResponse] = await Promise.all([
        getCategories(),
        getProducts({ page: 0, size: 10 }),
        getStores({ page: 0, size: 6 }),
      ]);

      setCategories([allCategory, ...getList(categoriesResponse)]);
      setProducts(getList(productsResponse));
      setStores(getList(storesResponse));
    } catch (homeError) {
      setError(getErrorMessage(homeError, 'No pudimos cargar el inicio.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadHomeData();
  }, [loadHomeData]);

  const goToProducts = (params = {}) => {
    navigation.navigate('ProductList', params);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        refreshControl={<RefreshControl tintColor={colors.primary} refreshing={refreshing} onRefresh={() => loadHomeData(true)} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Buenos días 👋</Text>
            <Text style={styles.userName}>{user?.fullName ?? user?.username ?? 'Invitado'}</Text>
          </View>
          <TouchableOpacity activeOpacity={0.8} style={styles.bellButton} onPress={() => navigation.navigate('Mensajes')}>
            <Ionicons name="notifications-outline" size={26} color={colors.textPrimary} />
            {unreadCount > 0 ? (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>

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
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({ title, actionLabel, onAction }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {actionLabel ? (
        <TouchableOpacity onPress={onAction} activeOpacity={0.7}>
          <Text style={styles.sectionAction}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
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
      <SkeletonLoader width={160} height={200} borderRadius={16} />
      <SkeletonLoader width={160} height={200} borderRadius={16} />
      <SkeletonLoader width={160} height={200} borderRadius={16} />
    </View>
  );
}

function StoreSkeletonRow() {
  return (
    <View style={styles.skeletonRow}>
      <SkeletonLoader width={160} height={180} borderRadius={16} />
      <SkeletonLoader width={160} height={180} borderRadius={16} />
      <SkeletonLoader width={160} height={180} borderRadius={16} />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    paddingBottom: spacing.xl,
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
    height: 130,
    justifyContent: 'center',
    borderRadius: 16,
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
});
