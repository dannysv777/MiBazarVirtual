import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import * as profileApi from '../../api/profileApi';
import { getMyStore } from '../../api/storesApi';
import AppBadge from '../../components/common/AppBadge';
import AppButton from '../../components/common/AppButton';
import AppInput from '../../components/common/AppInput';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { colors, shadows, spacing, typography } from '../../theme';
import { formatPrice, getErrorMessage, getPayload } from '../../utils/apiResponse';

const roleVariant = {
  BUYER: 'accent',
  SELLER: 'primary',
  ADMIN: 'error',
};

export default function ProfileScreen({ navigation }) {
  const { logout, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [appInfo, setAppInfo] = useState(null);
  const [myStore, setMyStore] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: '', phone: '' });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadProfile = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');

    try {
      const profileResponse = await profileApi.getProfile();
      const nextProfile = getPayload(profileResponse);
      setProfile(nextProfile);
      setEditForm({
        fullName: nextProfile?.fullName ?? '',
        phone: nextProfile?.phone ?? '',
      });

      const requests = [profileApi.getAppInfo()];

      if (nextProfile?.role === 'SELLER') {
        requests.push(profileApi.getSellerStats());
        requests.push(getMyStore());
      } else if (nextProfile?.role === 'BUYER') {
        requests.push(profileApi.getBuyerStats());
      }

      const responses = await Promise.allSettled(requests);
      setAppInfo(responses[0].status === 'fulfilled' ? getPayload(responses[0].value) : null);

      if (nextProfile?.role === 'SELLER') {
        setStats(responses[1]?.status === 'fulfilled' ? getPayload(responses[1].value) : null);
        setMyStore(responses[2]?.status === 'fulfilled' ? getPayload(responses[2].value) : null);
      } else if (nextProfile?.role === 'BUYER') {
        setStats(responses[1]?.status === 'fulfilled' ? getPayload(responses[1].value) : null);
      }
    } catch (profileError) {
      setError(getErrorMessage(profileError, 'No pudimos cargar tu perfil.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSave = async () => {
    setSaving(true);

    try {
      const response = await profileApi.updateProfile(editForm);
      const updatedProfile = getPayload(response);
      setProfile(updatedProfile);
      updateUser?.(updatedProfile);
      setIsEditing(false);
    } catch (saveError) {
      Alert.alert('Error', getErrorMessage(saveError, 'No pudimos actualizar tu perfil.'));
    } finally {
      setSaving(false);
    }
  };

  const confirmLogout = () => {
    Alert.alert(
      '¿Cerrar sesión?',
      'Tendrás que iniciar sesión de nuevo para continuar.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar sesión', style: 'destructive', onPress: logout },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingWrap}>
          <LoadingSpinner />
        </View>
      </SafeAreaView>
    );
  }

  const role = profile?.role ?? 'BUYER';
  const displayName = profile?.fullName || profile?.username || 'Usuario';

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <ScrollView
          refreshControl={(
            <RefreshControl
              tintColor={colors.primary}
              colors={[colors.primary]}
              refreshing={refreshing}
              onRefresh={() => loadProfile(true)}
            />
          )}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.profileHeader}>
            <TouchableOpacity
              activeOpacity={0.82}
              onPress={() => setIsEditing((current) => !current)}
              style={styles.editButton}
            >
              <Ionicons name={isEditing ? 'close' : 'pencil'} size={20} color={colors.surface} />
            </TouchableOpacity>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={styles.headerName}>{displayName}</Text>
            <AppBadge label={role} variant={roleVariant[role] ?? 'gray'} />
          </View>

          {error ? (
            <View style={styles.errorCard}>
              <Ionicons name="alert-circle" size={20} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity activeOpacity={0.75} onPress={() => loadProfile()}>
                <Text style={styles.retryText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={styles.sectionCard}>
            {isEditing ? (
              <>
                <AppInput
                  label="Nombre completo"
                  placeholder="Tu nombre"
                  value={editForm.fullName}
                  onChangeText={(fullName) => setEditForm((current) => ({ ...current, fullName }))}
                />
                <AppInput
                  label="Teléfono"
                  placeholder="Tu teléfono"
                  value={editForm.phone}
                  keyboardType="phone-pad"
                  onChangeText={(phone) => setEditForm((current) => ({ ...current, phone }))}
                />
                <View style={styles.editActions}>
                  <View style={styles.editButtonWrap}>
                    <AppButton title="Cancelar" variant="outline" fullWidth onPress={() => setIsEditing(false)} />
                  </View>
                  <View style={styles.editButtonWrap}>
                    <AppButton title="Guardar" fullWidth loading={saving} onPress={handleSave} />
                  </View>
                </View>
              </>
            ) : (
              <>
                <InfoRow label="Usuario" value={profile?.username} />
                <InfoRow label="Correo" value={profile?.email} />
                <InfoRow label="Teléfono" value={profile?.phone || 'Sin teléfono'} />
              </>
            )}
          </View>

          <View style={styles.statsRow}>
            {role === 'SELLER' ? (
              <>
                <StatCard icon="📋" value={stats?.pendingOrders ?? 0} label="Pendientes" />
                <StatCard icon="🛍️" value={stats?.activeProducts ?? 0} label="Productos" />
                <StatCard icon="⭐" value={Number(stats?.averageRating ?? 0).toFixed(1)} label="Rating" />
              </>
            ) : (
              <>
                <StatCard icon="📦" value={stats?.totalOrders ?? 0} label="Pedidos" />
                <StatCard icon="✅" value={stats?.deliveredOrders ?? 0} label="Entregados" />
                <StatCard icon="💰" value={formatPrice(stats?.totalSpent ?? 0).replace('.00', '')} label="Gastado" />
              </>
            )}
          </View>

          <View style={styles.menuCard}>
            <MenuSection title="Mi cuenta" />
            <MenuRow icon="receipt-outline" label="Mis pedidos" onPress={() => navigation.navigate('Pedidos')} />
            <MenuRow icon="chatbubble-outline" label="Mis conversaciones" onPress={() => navigation.navigate('Mensajes')} />

            {role === 'SELLER' ? (
              <>
                <MenuSection title="Vendedor" />
                <MenuRow
                  icon="storefront-outline"
                  label="Mi tienda"
                  onPress={() => myStore?.id && navigation.navigate('StoreDetail', { storeId: myStore.id })}
                />
              </>
            ) : null}

            <MenuSection title="App" />
            <MenuRow icon="information-circle-outline" label="Versión" rightValue={appInfo?.version ?? '1.0.0'} />
            <MenuRow icon="fast-food-outline" label="Productos disponibles" rightValue={appInfo?.totalProducts ?? 0} />

            <View style={styles.dangerDivider} />
            <MenuRow icon="log-out-outline" label="Cerrar sesión" danger noChevron onPress={confirmLogout} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function StatCard({ icon, value, label }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function MenuSection({ title }) {
  return <Text style={styles.menuSection}>{title}</Text>;
}

function MenuRow({ icon, label, rightValue, onPress, danger = false, noChevron = false }) {
  return (
    <TouchableOpacity activeOpacity={onPress ? 0.75 : 1} onPress={onPress} style={styles.menuRow}>
      <Ionicons name={icon} size={20} color={danger ? colors.error : colors.textSecondary} />
      <Text style={[styles.menuLabel, danger && styles.dangerText]}>{label}</Text>
      {rightValue !== undefined ? <Text style={styles.rightValue}>{rightValue}</Text> : null}
      {!noChevron && onPress ? <Ionicons name="chevron-forward" size={18} color={colors.textLight} /> : null}
    </TouchableOpacity>
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
  content: {
    paddingBottom: spacing.xl,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    backgroundColor: colors.secondary,
  },
  editButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  avatar: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 40,
    backgroundColor: colors.accent,
    marginBottom: spacing.md,
  },
  avatarText: {
    ...typography.h1,
    color: colors.surface,
  },
  headerName: {
    ...typography.h2,
    color: colors.surface,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  sectionCard: {
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  infoLabel: {
    ...typography.small,
  },
  infoValue: {
    ...typography.bodyBold,
    flex: 1,
    marginLeft: spacing.md,
    textAlign: 'right',
  },
  editActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  editButtonWrap: {
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  statIcon: {
    fontSize: 24,
  },
  statValue: {
    ...typography.h3,
    marginTop: spacing.xs,
  },
  statLabel: {
    ...typography.tiny,
    marginTop: 2,
    textAlign: 'center',
  },
  menuCard: {
    marginHorizontal: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  menuSection: {
    ...typography.tiny,
    color: colors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 46,
  },
  menuLabel: {
    ...typography.body,
    flex: 1,
    marginLeft: spacing.sm,
  },
  rightValue: {
    ...typography.small,
    color: colors.textPrimary,
    fontWeight: '700',
    marginRight: spacing.xs,
  },
  dangerDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  dangerText: {
    color: colors.error,
    fontWeight: '700',
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
});
