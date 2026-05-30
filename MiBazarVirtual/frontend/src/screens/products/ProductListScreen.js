import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getCategories } from '../../api/categoriesApi';
import { getProducts } from '../../api/productsApi';
import * as recommendationsApi from '../../api/recommendationsApi';
import EmptyState from '../../components/common/EmptyState';
import FocusAwareStatusBar from '../../components/common/FocusAwareStatusBar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import CategoryChip from '../../components/home/CategoryChip';
import ProductCard from '../../components/home/ProductCard';
import SearchBar from '../../components/home/SearchBar';
import { colors, spacing, typography } from '../../theme';
import { getErrorMessage, getList, getPageMeta } from '../../utils/apiResponse';
import { clearHistory, getHistory, removeSearch, saveSearch } from '../../utils/searchHistory';

const sortOptions = [
  { key: 'trending', label: 'Tendencias', icon: '🔥' },
  { key: 'newest', label: 'Recientes', icon: '🕐' },
  { key: 'price_asc', label: 'Precio ↑', icon: '💰' },
  { key: 'price_desc', label: 'Precio ↓', icon: '💸' },
  { key: 'name_asc', label: 'A-Z', icon: '🔤' },
];

export default function ProductListScreen({ navigation, route }) {
  const params = route.params ?? {};
  const [search, setSearch] = useState(params.query ?? '');
  const [submittedQuery, setSubmittedQuery] = useState(params.query ?? '');
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(params.categoryId ?? null);
  const [selectedSort, setSelectedSort] = useState('trending');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState('');
  const [searchHistory, setSearchHistory] = useState([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [discoveryTitle, setDiscoveryTitle] = useState('');

  const loadCategories = useCallback(async () => {
    try {
      const response = await getCategories();
      setCategories([{ id: null, name: 'Todos', icon: '🏪' }, ...getList(response)]);
    } catch (categoryError) {
      setCategories([{ id: null, name: 'Todos', icon: '🏪' }]);
    }
  }, []);

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
      const selectedCategory = categories.find((category) => category.id === selectedCategoryId);
      const useDiscovery = !submittedQuery && !onlyInStock && selectedSort === 'trending' && nextPage === 0;
      let nextProducts = [];
      let meta = { last: true };

      if (useDiscovery) {
        let trendingProducts = [];
        try {
          const trendingResponse = await recommendationsApi.getTrending(selectedCategoryId, 20);
          trendingProducts = getList(trendingResponse);
        } catch (recommendationError) {
          trendingProducts = [];
        }
        nextProducts = trendingProducts;

        if (selectedCategoryId && trendingProducts.length < 10) {
          const fallbackResponse = await getProducts({
            categoryId: selectedCategoryId,
            sortBy: 'newest',
            page: 0,
            size: 20,
          });
          const seen = new Set(trendingProducts.map((product) => product.id));
          nextProducts = [
            ...trendingProducts,
            ...getList(fallbackResponse).filter((product) => !seen.has(product.id)),
          ].slice(0, 20);
        }

        if (!selectedCategoryId && !nextProducts.length) {
          const fallbackResponse = await getProducts({
            sortBy: 'newest',
            page: 0,
            size: 20,
          });
          nextProducts = getList(fallbackResponse);
        }

        setDiscoveryTitle(selectedCategoryId ? `Tendencias en ${selectedCategory?.name ?? 'esta categoria'}` : 'Tendencias');
      } else {
        const effectiveSort = selectedSort === 'trending' ? 'newest' : selectedSort;
        const response = await getProducts({
          q: submittedQuery || undefined,
          categoryId: selectedCategoryId || undefined,
          sortBy: effectiveSort,
          inStock: onlyInStock || undefined,
          page: nextPage,
          size: 20,
        });
        nextProducts = getList(response);
        meta = getPageMeta(response);
        setDiscoveryTitle(submittedQuery ? 'Resultados de busqueda' : '');
      }

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
  }, [categories, onlyInStock, selectedCategoryId, selectedSort, submittedQuery]);

  const triggerSearch = useCallback(() => {
    setPage(0);
    setProducts([]);
    setHasMore(true);
    loadProducts({ nextPage: 0 });
  }, [loadProducts]);

  useEffect(() => {
    loadCategories();
    getHistory().then(setSearchHistory);
  }, [loadCategories]);

  useEffect(() => {
    setSearch(params.query ?? '');
    setSubmittedQuery(params.query ?? '');
    setSelectedCategoryId(params.categoryId ?? null);
  }, [params.categoryId, params.query]);

  useEffect(() => {
    triggerSearch();
  }, [triggerSearch]);

  const handleSearchSubmit = async () => {
    const normalized = search.trim();
    setSubmittedQuery(normalized);
    if (normalized) {
      setSearchHistory(await saveSearch(normalized));
    }
    setSearchFocused(false);
  };

  const handleHistoryPress = async (value) => {
    setSearch(value);
    setSubmittedQuery(value);
    setSearchFocused(false);
    setSearchHistory(await saveSearch(value));
  };

  const handleCategoryPress = async (categoryId) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategoryId((current) => (current === categoryId ? null : categoryId));
  };

  const handleSortPress = async (sortKey) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedSort(sortKey);
  };

  const handleStockPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOnlyInStock((current) => !current);
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
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <FocusAwareStatusBar style="dark" backgroundColor="transparent" translucent />
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>{params.title ?? 'Productos'}</Text>
      </View>

      <View style={styles.searchWrap}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          onSubmit={handleSearchSubmit}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
        />
      </View>

      {searchFocused && !search.trim() && searchHistory.length ? (
        <View style={styles.historyCard}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Búsquedas recientes</Text>
            <TouchableOpacity onPress={async () => {
              await clearHistory();
              setSearchHistory([]);
            }}>
              <Text style={styles.historyClear}>Borrar</Text>
            </TouchableOpacity>
          </View>
          {searchHistory.map((item) => (
            <TouchableOpacity key={item} activeOpacity={0.75} onPress={() => handleHistoryPress(item)} style={styles.historyRow}>
              <Ionicons name="time-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.historyText}>{item}</Text>
              <TouchableOpacity onPress={async () => setSearchHistory(await removeSearch(item))} style={styles.historyRemove}>
                <Ionicons name="close" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      <View style={styles.filterPanel}>
        <FlatList
          horizontal
          data={categories}
          style={styles.categoryList}
          keyExtractor={(item) => String(item.id ?? 'all')}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
          renderItem={({ item }) => (
            <CategoryChip
              category={item}
              isActive={item.id === selectedCategoryId}
              onPress={() => handleCategoryPress(item.id)}
            />
          )}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortScroll} contentContainerStyle={styles.sortRow}>
          {sortOptions.map((option) => {
            const selected = selectedSort === option.key;
            return (
              <TouchableOpacity
                key={option.key}
                activeOpacity={0.8}
                onPress={() => handleSortPress(option.key)}
                style={[styles.sortChip, selected ? styles.sortChipActive : styles.sortChipIdle]}
              >
                <Text style={[styles.sortText, selected ? styles.sortTextActive : styles.sortTextIdle]}>
                  {option.icon} {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleStockPress}
            style={[styles.stockChip, onlyInStock ? styles.stockChipActive : styles.stockChipIdle]}
          >
            <Text style={[styles.stockText, onlyInStock ? styles.stockTextActive : styles.stockTextIdle]}>En stock</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {error ? (
        <View style={styles.errorCard}>
          <Ionicons name="alert-circle" size={20} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity activeOpacity={0.75} onPress={() => loadProducts({ nextPage: 0 })}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.gridSkeleton}>
          <SkeletonLoader width="48%" height={220} borderRadius={16} />
          <SkeletonLoader width="48%" height={220} borderRadius={16} />
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
          refreshControl={(
            <RefreshControl
              tintColor={colors.primary}
              colors={[colors.primary]}
              refreshing={refreshing}
              onRefresh={() => loadProducts({ nextPage: 0, isRefresh: true })}
            />
          )}
          ListHeaderComponent={discoveryTitle ? (
            <Text style={styles.discoveryTitle}>{discoveryTitle}</Text>
          ) : null}
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
  filterPanel: {
    marginTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  categoryRow: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  categoryList: {
    flexGrow: 0,
    height: 44,
  },
  sortScroll: {
    flexGrow: 0,
    height: 46,
    marginTop: spacing.xs,
  },
  sortRow: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  sortChip: {
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  sortChipActive: {
    backgroundColor: colors.primary,
  },
  sortChipIdle: {
    backgroundColor: colors.background,
  },
  sortText: {
    ...typography.small,
    fontWeight: '700',
  },
  sortTextActive: {
    color: colors.surface,
  },
  sortTextIdle: {
    color: colors.textSecondary,
  },
  stockChip: {
    height: 38,
    minWidth: 86,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  stockChipActive: {
    backgroundColor: colors.accent,
  },
  stockChipIdle: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  stockText: {
    ...typography.small,
    fontWeight: '700',
  },
  stockTextActive: {
    color: colors.surface,
  },
  stockTextIdle: {
    color: colors.textSecondary,
  },
  historyCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.background,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  historyTitle: {
    ...typography.small,
    color: colors.textSecondary,
  },
  historyClear: {
    ...typography.small,
    color: colors.primary,
    fontWeight: '700',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  historyText: {
    ...typography.body,
    flex: 1,
    marginLeft: spacing.sm,
  },
  historyRemove: {
    padding: spacing.xs,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
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
  gridSkeleton: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: spacing.md,
  },
  listContent: {
    paddingBottom: 72,
  },
  discoveryTitle: {
    ...typography.bodyBold,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  columnWrapper: {
    gap: 12,
    paddingHorizontal: spacing.md,
  },
});
