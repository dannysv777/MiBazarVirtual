import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getCategories } from '../../api/categoriesApi';
import * as productsApi from '../../api/productsApi';
import AppButton from '../../components/common/AppButton';
import FocusAwareStatusBar from '../../components/common/FocusAwareStatusBar';
import AppImage from '../../components/common/AppImage';
import AppInput from '../../components/common/AppInput';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import CategoryChip from '../../components/home/CategoryChip';
import { useToast } from '../../context/ToastContext';
import { colors, shadows, spacing, typography } from '../../theme';
import { getErrorMessage, getList } from '../../utils/apiResponse';
import { scale } from '../../utils/responsive';

const units = ['libra', 'kg', 'unidad', 'litro', 'docena', 'bolsa', 'caja', 'manojo'];

export default function ProductFormScreen({ navigation, route, mode = 'create' }) {
  const product = route?.params?.product;
  const isEdit = mode === 'edit';
  const { showError, showInfo, showSuccess } = useToast();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    name: product?.name ?? '',
    description: product?.description ?? '',
    price: product?.price ? String(product.price) : '',
    stock: product?.stock !== undefined ? String(product.stock) : '',
    unit: product?.unit ?? '',
    categoryId: product?.category?.id ?? product?.categoryId ?? null,
    imageUrl: product?.imageUrl ?? null,
  });
  const [errors, setErrors] = useState({});
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [saving, setSaving] = useState(false);

  const canSubmit = useMemo(() => (
    form.name.trim().length >= 3
    && Number(form.price) > 0
    && form.unit.trim()
    && form.categoryId
    && form.stock !== ''
    && Number(form.stock) >= 0
  ), [form]);

  const loadCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const response = await getCategories();
      setCategories(getList(response));
    } catch (categoryError) {
      showError('No pudimos cargar categorías');
    } finally {
      setLoadingCategories(false);
    }
  }, [showError]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: null }));
  };

  const validate = () => {
    const nextErrors = {};
    if (form.name.trim().length < 3) nextErrors.name = 'Ingresa al menos 3 caracteres';
    if (!Number(form.price) || Number(form.price) <= 0) nextErrors.price = 'Ingresa un precio mayor a 0';
    if (!form.unit.trim()) nextErrors.unit = 'Selecciona o escribe una unidad';
    if (!form.categoryId) nextErrors.categoryId = 'Selecciona una categoría';
    if (form.stock === '' || Number(form.stock) < 0 || Number.isNaN(Number(form.stock))) nextErrors.stock = 'Ingresa stock válido';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        stock: Number(form.stock),
        unit: form.unit.trim(),
        categoryId: form.categoryId,
        imageUrl: form.imageUrl,
      };

      if (isEdit) {
        await productsApi.updateProduct(product.id, payload);
        showSuccess('Producto actualizado');
      } else {
        await productsApi.createProduct({ ...payload, imageUrl: null });
        showSuccess('¡Producto publicado!');
      }
      navigation.goBack();
    } catch (submitError) {
      showError(getErrorMessage(submitError, isEdit ? 'No pudimos actualizar el producto.' : 'No pudimos publicar el producto.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <FocusAwareStatusBar style="dark" backgroundColor="transparent" translucent />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>{isEdit ? 'Editar producto' : 'Nuevo producto'}</Text>
          <TouchableOpacity disabled={!canSubmit || saving} onPress={handleSubmit} style={styles.publishButton}>
            <Text style={[styles.publishText, (!canSubmit || saving) && styles.publishTextDisabled]}>
              {saving ? 'Guardando...' : isEdit ? 'Guardar' : 'Publicar'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => showInfo('La subida de fotos estará disponible próximamente')}
            style={styles.imagePicker}
          >
            {form.imageUrl ? (
              <AppImage uri={form.imageUrl} style={styles.imagePreview} fallbackEmoji="🛒" />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera-outline" size={48} color={colors.textSecondary} />
                <Text style={styles.imageText}>Agregar foto del producto</Text>
                <Text style={styles.imageHint}>(opcional por ahora)</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Información básica</Text>
            <AppInput
              label="Nombre del producto *"
              placeholder="Ej: Tomate Manzano fresco"
              value={form.name}
              onChangeText={(value) => updateField('name', value)}
              error={errors.name}
            />
            <AppInput
              label="Descripción"
              placeholder="Describe frescura, origen, características..."
              value={form.description}
              onChangeText={(value) => updateField('description', value)}
              multiline
              error={errors.description}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Precio y unidad</Text>
            <View style={styles.row}>
              <View style={styles.priceField}>
                <AppInput
                  label="Precio *"
                  placeholder="0.00"
                  keyboardType="numeric"
                  value={form.price}
                  onChangeText={(value) => updateField('price', value)}
                  error={errors.price}
                />
              </View>
              <View style={styles.unitField}>
                <AppInput
                  label="Unidad *"
                  placeholder="libra"
                  value={form.unit}
                  onChangeText={(value) => updateField('unit', value)}
                  error={errors.unit}
                />
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.unitRow}>
              {units.map((unit) => (
                <TouchableOpacity key={unit} onPress={() => updateField('unit', unit)} style={styles.unitChip}>
                  <Text style={styles.unitChipText}>{unit}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={[styles.card, errors.categoryId && styles.errorBorder]}>
            <Text style={styles.sectionTitle}>Categoría *</Text>
            {loadingCategories ? (
              <LoadingSpinner size="small" />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
                {categories.map((category) => (
                  <CategoryChip
                    key={category.id}
                    category={category}
                    isActive={category.id === form.categoryId}
                    onPress={() => updateField('categoryId', category.id)}
                  />
                ))}
              </ScrollView>
            )}
            {errors.categoryId ? <Text style={styles.inlineError}>{errors.categoryId}</Text> : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Stock disponible *</Text>
            <View style={styles.stockRow}>
              <View style={styles.stockInputWrap}>
                <AppInput
                  label="Cantidad disponible"
                  keyboardType="numeric"
                  value={form.stock}
                  onChangeText={(value) => updateField('stock', value)}
                  error={errors.stock}
                />
              </View>
              <TouchableOpacity
                onPress={() => updateField('stock', String(Math.max(0, Number(form.stock || 0) - 1)))}
                style={styles.stepButton}
              >
                <Ionicons name="remove" size={18} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => updateField('stock', String(Number(form.stock || 0) + 1))}
                style={styles.stepButton}
              >
                <Ionicons name="add" size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.note}>Podrás actualizar el stock después.</Text>
          </View>

          <AppButton
            title={isEdit ? 'Guardar cambios' : 'Publicar producto'}
            onPress={handleSubmit}
            loading={saving}
            disabled={!canSubmit}
            fullWidth
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function CreateProductScreen(props) {
  return <ProductFormScreen {...props} mode="create" />;
}

export function EditProductScreen(props) {
  return <ProductFormScreen {...props} mode="edit" />;
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
    padding: spacing.md,
  },
  backButton: {
    width: scale(40),
    height: scale(40),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: scale(20),
    backgroundColor: colors.surface,
  },
  title: {
    ...typography.h3,
    flex: 1,
    marginLeft: spacing.sm,
  },
  publishButton: {
    padding: spacing.sm,
  },
  publishText: {
    ...typography.bodyBold,
    color: colors.primary,
  },
  publishTextDisabled: {
    color: colors.textLight,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  imagePicker: {
    height: scale(200),
    marginBottom: spacing.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: scale(14),
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  imageText: {
    ...typography.bodyBold,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  imageHint: {
    ...typography.tiny,
    marginTop: 2,
  },
  card: {
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: scale(12),
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  sectionTitle: {
    ...typography.bodyBold,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  priceField: {
    flex: 2,
  },
  unitField: {
    flex: 1,
  },
  unitRow: {
    gap: spacing.sm,
  },
  unitChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: scale(18),
    backgroundColor: colors.background,
  },
  unitChipText: {
    ...typography.small,
    fontWeight: '700',
  },
  categoryRow: {
    gap: spacing.sm,
  },
  errorBorder: {
    borderWidth: 1,
    borderColor: colors.error,
  },
  inlineError: {
    ...typography.small,
    color: colors.error,
    marginTop: spacing.sm,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stockInputWrap: {
    flex: 1,
  },
  stepButton: {
    width: scale(40),
    height: scale(40),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: scale(20),
    backgroundColor: colors.primaryLight,
  },
  note: {
    ...typography.tiny,
    marginTop: spacing.xs,
  },
});
