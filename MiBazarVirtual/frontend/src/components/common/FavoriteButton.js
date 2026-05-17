import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, TouchableOpacity } from 'react-native';

import * as favoritesApi from '../../api/favoritesApi';
import { useToast } from '../../context/ToastContext';
import { colors, shadows } from '../../theme';
import { getErrorMessage, getPayload } from '../../utils/apiResponse';
import { scale } from '../../utils/responsive';

export default function FavoriteButton({
  productId,
  initialIsFavorite = false,
  size = 24,
  style,
  onChange,
}) {
  const { showSuccess, showError } = useToast();
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [loading, setLoading] = useState(false);
  const scaleValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setIsFavorite(initialIsFavorite);
  }, [initialIsFavorite]);

  const animate = () => {
    Animated.sequence([
      Animated.spring(scaleValue, { toValue: 1.3, friction: 4, tension: 180, useNativeDriver: true }),
      Animated.spring(scaleValue, { toValue: 1, friction: 5, tension: 140, useNativeDriver: true }),
    ]).start();
  };

  const handlePress = async () => {
    if (loading || !productId) {
      return;
    }

    animate();
    setLoading(true);

    try {
      const response = await favoritesApi.toggleFavorite(productId);
      const payload = getPayload(response);
      const nextFavorite = Boolean(payload?.isFavorite);
      setIsFavorite(nextFavorite);
      onChange?.(nextFavorite);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      showSuccess(payload?.message ?? response.data?.message ?? 'Favoritos actualizados');
    } catch (error) {
      showError(getErrorMessage(error, 'No pudimos actualizar favoritos.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.78}
      disabled={loading}
      onPress={handlePress}
      style={[styles.button, { width: scale(size + 18), height: scale(size + 18), borderRadius: scale((size + 18) / 2) }, style]}
    >
      <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
        <Ionicons
          name={isFavorite ? 'heart' : 'heart-outline'}
          size={scale(size)}
          color={isFavorite ? colors.error : colors.surface}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.18)',
    ...shadows.card,
  },
});
