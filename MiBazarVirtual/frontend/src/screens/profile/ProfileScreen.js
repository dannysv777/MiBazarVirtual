import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import * as profileApi from '../../api/profileApi';
import { getMyStore } from '../../api/storesApi';
import { uploadImage } from '../../api/uploadApi';
import AppBadge from '../../components/common/AppBadge';
import AppButton from '../../components/common/AppButton';
import AppImage from '../../components/common/AppImage';
import FocusAwareStatusBar from '../../components/common/FocusAwareStatusBar';
import AppInput from '../../components/common/AppInput';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { colors, shadows, spacing, typography } from '../../theme';
import { formatPrice } from '../../utils/formatters';
import { getErrorMessage, getPayload } from '../../utils/apiResponse';
import { scale } from '../../utils/responsive';

const roleVariant = {
  BUYER: 'accent',
  SELLER: 'primary',
  ADMIN: 'error',
};

const getInitial = (user) => {
  if (user?.fullName) return user.fullName[0].toUpperCase();
  if (user?.username) return user.username[0].toUpperCase();
  return '?';
};

const getProfileImage = (user) => (
  user?.profileImage
  ?? user?.profileImageUrl
  ?? user?.profilePicture
  ?? user?.avatarUrl
  ?? user?.photoUrl
  ?? user?.logoUrl
  ?? ''
);

const getUploadedImageUrl = (uploaded) => (
  uploaded?.url
  ?? uploaded?.secureUrl
  ?? uploaded?.secure_url
  ?? uploaded?.imageUrl
  ?? uploaded?.profileImage
  ?? ''
);

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { logout, updateUser, user } = useAuth();
  const { showError, showSuccess } = useToast();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [appInfo, setAppInfo] = useState(null);
  const [myStore, setMyStore] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: '', phone: '', profileImage: '' });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState('');
  const scrollY = useRef(new Animated.Value(0)).current;

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
      const nextRole = String(nextProfile?.role ?? '').trim().toUpperCase();
      setProfile(nextProfile);
      setEditForm({
        fullName: nextProfile?.fullName ?? '',
        phone: nextProfile?.phone ?? '',
        profileImage: getProfileImage(nextProfile),
      });

      const requests = [profileApi.getAppInfo()];

      if (nextRole === 'SELLER') {
        requests.push(profileApi.getSellerStats());
        requests.push(getMyStore());
      } else if (nextRole === 'BUYER') {
        requests.push(profileApi.getBuyerStats());
      } else if (nextRole === 'DELIVERY') {
        requests.push(profileApi.getDeliveryStats());
      }

      const responses = await Promise.allSettled(requests);
      setAppInfo(responses[0].status === 'fulfilled' ? getPayload(responses[0].value) : null);

      if (nextRole === 'SELLER') {
        setStats(responses[1]?.status === 'fulfilled' ? getPayload(responses[1].value) : null);
        setMyStore(responses[2]?.status === 'fulfilled' ? getPayload(responses[2].value) : null);
      } else if (nextRole === 'BUYER') {
        setStats(responses[1]?.status === 'fulfilled' ? getPayload(responses[1].value) : null);
      } else if (nextRole === 'DELIVERY') {
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

  useFocusEffect(
    useCallback(() => {
      loadProfile(true);
    }, [loadProfile])
  );

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

  const handlePickProfileImage = async () => {
    if (uploadingPhoto || saving) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showError('Necesitamos permiso para abrir tu galería.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.82,
    });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    setUploadingPhoto(true);
    try {
      const uploaded = await uploadImage(result.assets[0]);
      const profileImage = getUploadedImageUrl(uploaded);

      if (!profileImage) {
        showError('La imagen se subio, pero no recibimos la URL de la foto.');
        return;
      }

      const nextForm = {
        fullName: editForm.fullName || profile?.fullName || profile?.username || 'Usuario',
        phone: editForm.phone ?? profile?.phone ?? '',
        profileImage,
      };
      const response = await profileApi.updateProfile(nextForm);
      const updatedProfile = getPayload(response);

      setEditForm({
        fullName: updatedProfile?.fullName ?? nextForm.fullName,
        phone: updatedProfile?.phone ?? nextForm.phone,
        profileImage: getProfileImage(updatedProfile) || profileImage,
      });
      setProfile(updatedProfile);
      updateUser?.(updatedProfile);
      showSuccess('Foto de perfil actualizada');
    } catch (uploadError) {
      showError(getErrorMessage(uploadError, 'No pudimos subir la foto.'));
    } finally {
      setUploadingPhoto(false);
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

  const navigateToTab = (tabName, screenName, params) => {
    const parentNavigation = navigation.getParent?.();
    const target = screenName ? { screen: screenName, params } : undefined;

    if (parentNavigation) {
      parentNavigation.navigate(tabName, target);
      return;
    }

    navigation.navigate(tabName, target);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <FocusAwareStatusBar style="dark" backgroundColor="transparent" translucent />
        <View style={styles.loadingWrap}>
          <LoadingSpinner />
        </View>
      </SafeAreaView>
    );
  }

  const role = String(profile?.role ?? 'BUYER').trim().toUpperCase();
  const displayName = profile?.fullName || profile?.username || 'Usuario';
  const profileImageUri = editForm.profileImage || getProfileImage(profile) || getProfileImage(user) || myStore?.logoUrl;
  const headerContentOpacity = scrollY.interpolate({
    inputRange: [0, 54, 96],
    outputRange: [1, 0.25, 0],
    extrapolate: 'clamp',
  });
  const topFadeOpacity = scrollY.interpolate({
    inputRange: [10, 90],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.safeArea}>
      <FocusAwareStatusBar style="light" backgroundColor="transparent" translucent />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <Animated.ScrollView
          refreshControl={(
            <RefreshControl
              tintColor={colors.primary}
              colors={[colors.primary]}
              refreshing={refreshing}
              onRefresh={() => loadProfile(true)}
            />
          )}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
        >
          <View style={[styles.profileHeader, { paddingTop: insets.top + spacing.xl }]}>
            {myStore?.bannerUrl ? (
              <AppImage uri={myStore.bannerUrl} style={styles.profileBannerImage} fallbackEmoji="🏪" />
            ) : null}
            {myStore?.bannerUrl ? <View style={styles.profileBannerOverlay} /> : null}
            <Animated.View style={[styles.profileHeaderContent, { opacity: headerContentOpacity }]}>
            <TouchableOpacity
              activeOpacity={0.82}
              onPress={() => setIsEditing((current) => !current)}
              style={styles.editButton}
            >
              <Ionicons name={isEditing ? 'close' : 'pencil'} size={20} color={colors.surface} />
            </TouchableOpacity>
            <View style={styles.avatar}>
              <AppImage
                uri={profileImageUri}
                style={styles.avatarImage}
                fallbackEmoji={getInitial(profile)}
              />
              {isEditing ? (
                <TouchableOpacity
                  activeOpacity={0.8}
                  disabled={uploadingPhoto}
                  onPress={handlePickProfileImage}
                  style={styles.cameraBadge}
                >
                  <Ionicons name={uploadingPhoto ? 'cloud-upload-outline' : 'camera-outline'} size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              ) : null}
            </View>
            <Text style={styles.headerName}>{displayName}</Text>
            <AppBadge label={role} variant={roleVariant[role] ?? 'gray'} />
            </Animated.View>
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
                <TouchableOpacity activeOpacity={0.8} onPress={handlePickProfileImage} style={styles.photoAction}>
                  <Ionicons name="image-outline" size={18} color={colors.primary} />
                  <Text style={styles.photoActionText}>
                    {uploadingPhoto ? 'Subiendo foto...' : editForm.profileImage ? 'Cambiar foto de perfil' : 'Subir foto de perfil'}
                  </Text>
                </TouchableOpacity>
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
            ) : role === 'DELIVERY' ? (
              <>
                <StatCard icon="📦" value={stats?.totalOrders ?? 0} label="Asignados" />
                <StatCard icon="✅" value={stats?.deliveredOrders ?? 0} label="Entregados" />
                <StatCard
                  icon="💰"
                  value={formatPrice(stats?.totalCollected ?? 0).replace('.00', '')}
                  label="Cobrado"
                />
              </>
            ) : (
              <>
                <StatCard icon="📦" value={stats?.totalOrders ?? 0} label="Pedidos" />
                <StatCard icon="✅" value={stats?.deliveredOrders ?? 0} label="Entregados" />
                <StatCard
                  icon="💰"
                  value={formatPrice(stats?.totalSpent ?? 0).replace('.00', '')}
                  label="Gastado"
                />
              </>
            )}
          </View>

          <View style={styles.menuCard}>
            <MenuSection title="Mi cuenta" />
            {role === 'BUYER' ? (
              <>
                <MenuRow icon="receipt-outline" label="Mis pedidos" onPress={() => navigateToTab('Pedidos', 'Orders')} />
                <MenuRow
                  icon="heart-outline"
                  label="Mis favoritos"
                  iconColor={colors.error}
                  onPress={() => navigation.navigate('Favorites')}
                />
                <MenuRow
                  icon="card-outline"
                  label="Mi billetera"
                  iconColor={colors.primary}
                  onPress={() => navigation.navigate('Wallet')}
                />
              </>
            ) : null}
            {role !== 'DELIVERY' ? (
              <MenuRow icon="chatbubble-outline" label="Mis conversaciones" onPress={() => navigateToTab('Mensajes', 'Conversations')} />
            ) : null}

            {role === 'SELLER' ? (
              <>
                <MenuSection title="Vendedor" />
                <MenuRow
                  icon="storefront-outline"
                  label="Mi tienda"
                  onPress={() => navigation.navigate('SellerStore', { storeId: user?.storeId ?? profile?.storeId ?? myStore?.id })}
                />
                <MenuRow
                  icon="business-outline"
                  label="Mi cuenta bancaria"
                  iconColor={colors.primary}
                  onPress={() => navigation.navigate('Wallet')}
                />
                <MenuRow
                  icon="receipt-outline"
                  label="Pedidos recibidos"
                  onPress={() => navigation.navigate('SellerOrders')}
                />
                <MenuRow
                  icon="eye-outline"
                  label="Ver tienda publica"
                  onPress={() => myStore?.id && navigation.navigate('StoreDetail', { storeId: myStore.id, sellerPreview: true })}
                />
                <MenuRow
                  icon="cube-outline"
                  label="Mis productos"
                  onPress={() => navigation.navigate('SellerProducts')}
                />
              </>
            ) : null}

            <MenuSection title="App" />
            <MenuRow icon="information-circle-outline" label="Versión" rightValue={appInfo?.version ?? '1.0.0'} />
            <MenuRow icon="fast-food-outline" label="Productos disponibles" rightValue={appInfo?.totalProducts ?? 0} />

            <View style={styles.dangerDivider} />
            <MenuRow icon="log-out-outline" label="Cerrar sesión" danger noChevron onPress={confirmLogout} />
          </View>
        </Animated.ScrollView>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.profileTopFade,
            {
              height: insets.top + 38,
              opacity: topFadeOpacity,
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(27,67,50,0.92)', 'rgba(27,67,50,0.5)', 'rgba(27,67,50,0)']}
            locations={[0, 0.5, 1]}
            style={styles.profileTopGradient}
          />
        </Animated.View>
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

function MenuRow({ icon, label, rightValue, onPress, danger = false, noChevron = false, iconColor }) {
  return (
    <TouchableOpacity activeOpacity={onPress ? 0.75 : 1} onPress={onPress} style={styles.menuRow}>
      <Ionicons name={icon} size={20} color={iconColor ?? (danger ? colors.error : colors.textSecondary)} />
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
    paddingBottom: scale(120),
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
    overflow: 'hidden',
  },
  profileBannerImage: {
    ...StyleSheet.absoluteFillObject,
  },
  profileBannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.38)',
  },
  profileHeaderContent: {
    alignItems: 'center',
    width: '100%',
  },
  profileTopFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  profileTopGradient: {
    flex: 1,
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
    overflow: 'hidden',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  avatarText: {
    ...typography.h1,
    color: colors.surface,
  },
  photoAction: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    marginBottom: spacing.md,
  },
  photoActionText: {
    ...typography.small,
    color: colors.primary,
    fontWeight: '800',
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
