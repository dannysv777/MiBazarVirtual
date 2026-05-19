import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import * as storesApi from '../../api/storesApi';
import { uploadImage } from '../../api/uploadApi';
import AppButton from '../../components/common/AppButton';
import AppImage from '../../components/common/AppImage';
import AppInput from '../../components/common/AppInput';
import EmptyState from '../../components/common/EmptyState';
import FocusAwareStatusBar from '../../components/common/FocusAwareStatusBar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import { colors, shadows, spacing, typography } from '../../theme';
import { getErrorMessage, getPayload } from '../../utils/apiResponse';
import { scale } from '../../utils/responsive';

const emptyForm = {
  name: '',
  description: '',
  address: '',
  city: 'Guatemala',
  phone: '',
  schedule: '',
  logoUrl: '',
  bannerUrl: '',
};

export default function SellerStoreScreen({ navigation }) {
  const { showError, showSuccess } = useToast();
  const [store, setStore] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState(null);
  const [error, setError] = useState('');

  const loadStore = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await storesApi.getMyStore();
      const nextStore = getPayload(response);
      setStore(nextStore);
      setForm({
        name: nextStore?.name ?? '',
        description: nextStore?.description ?? '',
        address: nextStore?.address ?? '',
        city: nextStore?.city ?? 'Guatemala',
        phone: nextStore?.phone ?? '',
        schedule: nextStore?.schedule ?? '',
        logoUrl: nextStore?.logoUrl ?? '',
        bannerUrl: nextStore?.bannerUrl ?? '',
      });
    } catch (storeError) {
      const status = storeError.response?.status;
      if (status === 404) {
        setStore(null);
        setForm(emptyForm);
      } else {
        const message = getErrorMessage(storeError, 'No pudimos cargar tu tienda.');
        setError(message);
        showError(message);
      }
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadStore();
  }, [loadStore]);

  const updateField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const handlePickImage = async (field, aspect) => {
    if (uploadingField || saving) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showError('Necesitamos permiso para abrir tu galeria.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect,
      quality: 0.82,
    });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    setUploadingField(field);
    try {
      const uploaded = await uploadImage(result.assets[0]);
      updateField(field, uploaded.url);
      showSuccess(field === 'logoUrl' ? 'Logo subido' : 'Portada subida');
    } catch (uploadError) {
      showError(getErrorMessage(uploadError, 'No pudimos subir la imagen.'));
    } finally {
      setUploadingField(null);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      showError('Ingresa el nombre de tu tienda.');
      return;
    }

    setSaving(true);
    setError('');

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      phone: form.phone.trim(),
      schedule: form.schedule.trim(),
      logoUrl: form.logoUrl,
      bannerUrl: form.bannerUrl,
      latitude: null,
      longitude: null,
    };

    try {
      const response = store?.id
        ? await storesApi.updateStore(store.id, payload)
        : await storesApi.createStore(payload);
      const nextStore = getPayload(response);
      setStore(nextStore);
      showSuccess(store?.id ? 'Tienda actualizada' : 'Tienda creada');
    } catch (saveError) {
      const message = getErrorMessage(saveError, 'No pudimos guardar tu tienda.');
      setError(message);
      showError(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <FocusAwareStatusBar style="dark" backgroundColor="transparent" translucent />
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FocusAwareStatusBar style="dark" backgroundColor="transparent" translucent />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity activeOpacity={0.75} onPress={() => navigation.goBack()} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.title}>Mi tienda</Text>
            <Text style={styles.subtitle}>Perfil publico y datos operativos</Text>
          </View>
          {store?.id ? (
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => navigation.navigate('StoreDetail', { storeId: store.id, sellerPreview: true })}
              style={styles.previewButton}
            >
              <Ionicons name="eye-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
          ) : null}
        </View>

        {store?.id ? (
          <View style={styles.previewCard}>
            <StoreLogo uri={form.logoUrl || store.logoUrl} />
            <View style={styles.previewInfo}>
              <Text style={styles.previewName}>{store.name}</Text>
              <Text style={styles.previewMeta}>{store.city ?? 'Guatemala'} · {store.schedule || 'Horario por definir'}</Text>
              <Text style={styles.previewRating}>⭐ {Number(store.ratingAvg ?? 0).toFixed(1)} · {store.ratingCount ?? 0} reseñas</Text>
            </View>
          </View>
        ) : (
          <EmptyState
            emoji="🏪"
            title="Crea el perfil de tu tienda"
            subtitle="Agrega nombre, horario y datos visibles para tus compradores."
          />
        )}

        <View style={styles.formCard}>
          <Text style={styles.cardTitle}>Informacion de la tienda</Text>
          <TouchableOpacity
            activeOpacity={0.85}
            disabled={Boolean(uploadingField) || saving}
            onPress={() => handlePickImage('bannerUrl', [16, 9])}
            style={styles.bannerPicker}
          >
            {uploadingField === 'bannerUrl' ? (
              <ImagePlaceholder icon="cloud-upload-outline" title="Subiendo portada..." />
            ) : form.bannerUrl ? (
              <AppImage uri={form.bannerUrl} style={styles.bannerImage} fallbackEmoji="🏪" />
            ) : (
              <ImagePlaceholder icon="image-outline" title="Agregar portada" subtitle="Ideal para mostrar tu tienda" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            disabled={Boolean(uploadingField) || saving}
            onPress={() => handlePickImage('logoUrl', [1, 1])}
            style={styles.logoPicker}
          >
            {uploadingField === 'logoUrl' ? (
              <ImagePlaceholder icon="cloud-upload-outline" title="Subiendo logo..." compact />
            ) : form.logoUrl ? (
              <AppImage uri={form.logoUrl} style={styles.logoImage} fallbackEmoji="🏪" />
            ) : (
              <ImagePlaceholder icon="camera-outline" title="Agregar logo" compact />
            )}
          </TouchableOpacity>
          <AppInput
            label="Nombre de la tienda"
            value={form.name}
            onChangeText={(value) => updateField('name', value)}
            leftIcon="storefront-outline"
          />
          <AppInput
            multiline
            label="Descripcion"
            placeholder="Que vendes, que te hace diferente o como atiendes pedidos"
            value={form.description}
            onChangeText={(value) => updateField('description', value)}
          />
          <AppInput
            label="Horario"
            placeholder="Lun a Sab, 8:00 a 18:00"
            value={form.schedule}
            onChangeText={(value) => updateField('schedule', value)}
            leftIcon="time-outline"
          />
          <AppInput
            label="Telefono"
            value={form.phone}
            onChangeText={(value) => updateField('phone', value)}
            keyboardType="phone-pad"
            leftIcon="call-outline"
          />
          <AppInput
            label="Ciudad"
            value={form.city}
            onChangeText={(value) => updateField('city', value)}
            leftIcon="business-outline"
          />
          <AppInput
            multiline
            label="Direccion"
            value={form.address}
            onChangeText={(value) => updateField('address', value)}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <AppButton
            title={store?.id ? 'Guardar cambios' : 'Crear tienda'}
            onPress={handleSave}
            loading={saving}
            fullWidth
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StoreLogo({ uri }) {
  if (uri) {
    return <AppImage uri={uri} style={styles.storeLogoImage} fallbackEmoji="🏪" />;
  }

  return (
    <View style={styles.storeAvatar}>
      <Ionicons name="storefront" size={28} color={colors.surface} />
    </View>
  );
}

function ImagePlaceholder({ icon, title, subtitle, compact = false }) {
  return (
    <View style={[styles.imagePlaceholder, compact && styles.imagePlaceholderCompact]}>
      <Ionicons name={icon} size={compact ? 24 : 36} color={colors.textSecondary} />
      <Text style={styles.imagePlaceholderTitle}>{title}</Text>
      {subtitle ? <Text style={styles.imagePlaceholderSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconButton: {
    width: scale(40),
    height: scale(40),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: scale(20),
    backgroundColor: colors.surface,
    marginRight: spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  title: {
    ...typography.h2,
  },
  subtitle: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: 2,
  },
  previewButton: {
    width: scale(40),
    height: scale(40),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: scale(20),
    backgroundColor: colors.primaryLight,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  storeAvatar: {
    width: scale(58),
    height: scale(58),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: scale(29),
    backgroundColor: colors.secondary,
    marginRight: spacing.md,
  },
  storeLogoImage: {
    width: scale(58),
    height: scale(58),
    borderRadius: scale(29),
    marginRight: spacing.md,
  },
  previewInfo: {
    flex: 1,
  },
  previewName: {
    ...typography.bodyBold,
  },
  previewMeta: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: 2,
  },
  previewRating: {
    ...typography.tiny,
    color: colors.primary,
    marginTop: spacing.xs,
    fontWeight: '800',
  },
  formCard: {
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  bannerPicker: {
    height: scale(150),
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.background,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  logoPicker: {
    width: scale(92),
    height: scale(92),
    alignSelf: 'center',
    borderRadius: scale(46),
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.background,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  logoImage: {
    width: '100%',
    height: '100%',
    borderRadius: scale(46),
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  imagePlaceholderCompact: {
    padding: spacing.sm,
  },
  imagePlaceholderTitle: {
    ...typography.small,
    color: colors.textSecondary,
    fontWeight: '800',
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  imagePlaceholderSubtitle: {
    ...typography.tiny,
    color: colors.textLight,
    marginTop: 2,
    textAlign: 'center',
  },
  cardTitle: {
    ...typography.bodyBold,
    marginBottom: spacing.md,
  },
  errorText: {
    ...typography.small,
    color: colors.error,
    backgroundColor: '#FFE9E8',
    padding: spacing.sm,
    borderRadius: 10,
    marginBottom: spacing.md,
  },
});
