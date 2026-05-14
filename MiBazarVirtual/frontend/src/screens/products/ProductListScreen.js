import { Ionicons } from '@expo/vector-icons';
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
import LoadingSpinner from '../../components/common/LoadingSpinner';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import ProductCard from '../../components/home/ProductCard';
import SearchBar from '../../components/home/SearchBar';
import { getProducts } from '../../api/productsApi';
import { colors, spacing, typography } from '../../theme';
import { getErrorMessage, getList, getPageMeta } from '../../utils/apiResponse';

const filtersConfig = [
  { key: 'inStock', label: 'En stock', params: { inStock: true } },
  { key: 'priceAsc', label: 'Precio ↑', params: { sortBy: 'price_asc' } },
  { key: 'priceDesc', label: 'Precio ↓', params: { sortBy: 'price_desc' } },
  { key: 'recent', label: 'Recientes', params: { sortBy: 'recent' } },
  { key: 'az', label: 'A-Z', params: { sortBy: 'name_asc' } },
];

export default function ProductListScreen({ navigation, route }) {
  const { query, categoryId, title } = route.params ?? {};
  const [search, setSearch] = useState(query ?? '');
  const [submittedQuery, setSubmittedQuery] = useState(query ?? '');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [activeFilter, setActiveFilter] = useState(null);
  const [error, setError] = useState('');

  const buildParams = useCallback((nextPage) => {
    const filter = filtersConfig.find((item) => item.key === activeFilter);
    return {
      q: submittedQuery || undefined,
      categoryId,
      page: nextPage,
      size: 20,
      ...filter?.params,
    };
  }, [activeFilter, categoryId, submittedQuery]);

  const loadProducts = useCallback(async ({ nextPage = 0, append = false, isRefresh = false } = {}) => {
    if (append) {
      setLoadingMore(true);
    } else if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');

    try {
      const response = await getProducts(buildParams(nextPage));
      const nextProducts = getList(response);
      const meta = getPageMeta(response);

      setProducts((current) => (append ? [...current, ...nextProducts] : nextProducts));
      setPage(nextPage);
      setHasMore(!meta.last && nextProducts.length > 0);
    } catch (productsError) {
      setError(getErrorMessage(productsError, 'No pudimos cargar productos.'));
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [buildParams]);

  useEffect(() => {
    setSearch(query ?? '');
    setSubmittedQuery(query ?? '');
  }, [query]);

  useEffect(() => {
    loadProducts({ nextPage: 0 });
  }, [activeFilter, categoryId, loadProducts]);

  const handleSearchSubmit = () => {
    setSubmittedQuery(search);
  };

  const handleLoadMore = () => {
    if (!loadingMore && !loading && hasMore) {
      loadProducts({ nextPage: page + 1, append: true });
    }
  };

  const renderProduct = ({ item }) => (
    <ProductCard product={item} onPress={() => navigation.navigate('ProductDetail', { productId: item.id })} />
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>{title ?? 'Productos'}</Text>
      </View>

      <View style={styles.searchWrap}>
        <SearchBar value={search} onChangeText={setSearch} onSubmit={handleSearchSubmit} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {filtersConfig.map((filter) => {
          const selected = activeFilter === filter.key;
          return (
            <TouchableOpacity
              key={filter.key}
              activeOpacity={0.8}
              onPress={() => setActiveFilter((current) => (current === filter.key ? null : filter.key))}
              style={[styles.filterChip, selected ? styles.filterActive : styles.filterIdle]}
            >
              <Text style={[styles.filterText, selected ? styles.filterTextActive : styles.filterTextIdle]}>{filter.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.gridSkeleton}>
          <SkeletonLoader width="48%" height={220} borderRadius={16} />
          <SkeletonLoader width="48%" height={220} borderRadius={16} />
          <SkeletonLoader width="48%" height={220} borderRadius={16} />
          <SkeletonLoader width="48%" height={220} borderRadius={16} />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderProduct}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          refreshControl={<RefreshControl tintColor={colors.primary} refreshing={refreshing} onRefresh={() => loadProducts({ nextPage: 0, isRefresh: true })} />}
          ListFooterComponent={loadingMore ? <LoadingSpinner size="small" /> : null}
          ListEmptyComponent={<EmptyState emoji="🔎" title="Sin resultados" subtitle="Prueba con otra búsqueda o filtro." />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: colors.background,
    marginRight: spacing.sm,
  },
  title: {
    ...typography.h3,
    flex: 1,
  },
  searchWrap: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  filterRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  filterActive: {
    backgroundColor: colors.primary,
  },
  filterIdle: {
    backgroundColor: colors.background,
  },
  filterText: {
    ...typography.small,
    fontWeight: '700',
  },
  filterTextActive: {
    color: colors.surface,
  },
  filterTextIdle: {
    color: colors.textSecondary,
  },
  errorCard: {
    marginHorizontal: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: '#FFE9E8',
  },
  errorText: {
    ...typography.small,
    color: colors.error,
  },
  gridSkeleton: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: spacing.md,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  columnWrapper: {
    gap: 12,
    paddingHorizontal: spacing.md,
  },
});
