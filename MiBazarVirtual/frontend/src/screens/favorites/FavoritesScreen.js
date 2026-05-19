import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import * as favoritesApi from '../../api/favoritesApi';
import EmptyState from '../../components/common/EmptyState';
import FocusAwareStatusBar from '../../components/common/FocusAwareStatusBar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ProductCard from '../../components/home/ProductCard';
import { useToast } from '../../context/ToastContext';
import { colors, spacing, typography } from '../../theme';
import { getErrorMessage, getList } from '../../utils/apiResponse';

export default function FavoritesScreen({ navigation }) {
  const { showError } = useToast();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadFavorites = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');

    try {
      const response = await favoritesApi.getFavorites();
      setFavorites(getList(response));
    } catch (favoriteError) {
      setError(getErrorMessage(favoriteError, 'No pudimos cargar tus favoritos.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const handleFavoriteChange = (productId, nextFavorite) => {
    if (nextFavorite) {
      return;
    }

    setFavorites((current) => current.filter((product) => product.id !== productId));
  };

  const renderProduct = ({ item }) => (
    <ProductCard
      product={item}
      showFavorite
      isFavorite
      onFavoriteChange={(nextFavorite) => handleFavoriteChange(item.id, nextFavorite)}
      onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
    />
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <FocusAwareStatusBar style="dark" backgroundColor="transparent" translucent />
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.title}>Mis favoritos</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{favorites.length}</Text>
          </View>
        </View>
      </View>

      {error ? (
        <View style={styles.errorCard}>
          <Ionicons name="alert-circle" size={20} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity activeOpacity={0.75} onPress={() => loadFavorites()}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.loadingWrap}>
          <LoadingSpinner />
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={favorites.length ? styles.columnWrapper : null}
          contentContainerStyle={favorites.length ? styles.listContent : styles.emptyContent}
          renderItem={renderProduct}
          refreshControl={(
            <RefreshControl
              tintColor={colors.primary}
              colors={[colors.primary]}
              refreshing={refreshing}
              onRefresh={() => loadFavorites(true)}
            />
          )}
          ListEmptyComponent={(
            <EmptyState
              emoji="❤️"
              title="Aun no tienes favoritos"
              subtitle="Toca el corazon en cualquier producto para guardarlo aqui"
              actionLabel="Explorar productos"
              onAction={() => navigation.navigate('Inicio', { screen: 'Home' })}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  backButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    backgroundColor: colors.surface,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  title: {
    ...typography.h2,
  },
  countBadge: {
    minWidth: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    marginLeft: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  countText: {
    ...typography.small,
    color: colors.primary,
    fontWeight: '800',
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: 86,
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.md,
  },
  columnWrapper: {
    gap: 12,
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
});
