import { Ionicons } from '@expo/vector-icons';
import { useMemo, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppButton from '../../components/common/AppButton';
import FocusAwareStatusBar from '../../components/common/FocusAwareStatusBar';
import { colors, spacing, typography } from '../../theme';
import { SCREEN_WIDTH_EXPORT, scale } from '../../utils/responsive';

const slides = [
  {
    icon: 'storefront-outline',
    title: 'Tu mercado local en una app',
    text: 'Encuentra tiendas, productos frescos y vendedores cercanos desde un solo lugar.',
  },
  {
    icon: 'chatbubbles-outline',
    title: 'Habla directo con vendedores',
    text: 'Consulta productos, resuelve dudas y coordina detalles antes de confirmar tu pedido.',
  },
  {
    icon: 'receipt-outline',
    title: 'Compra simple y seguimiento claro',
    text: 'Arma tu carrito, confirma contra entrega y revisa el estado del pedido cuando quieras.',
  },
];

export default function OnboardingScreen({ navigation, onFinish }) {
  const listRef = useRef(null);
  const [index, setIndex] = useState(0);

  const viewabilityConfig = useMemo(() => ({ itemVisiblePercentThreshold: 70 }), []);
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    const nextIndex = viewableItems[0]?.index;
    if (typeof nextIndex === 'number') {
      setIndex(nextIndex);
    }
  }).current;

  const finish = async () => {
    await onFinish?.();
    navigation.replace('Login');
  };

  const next = () => {
    if (index >= slides.length - 1) {
      finish();
      return;
    }
    listRef.current?.scrollToIndex({ index: index + 1 });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <FocusAwareStatusBar style="light" backgroundColor="transparent" translucent />
      <View style={styles.topBar}>
        <Text style={styles.brand}>MiBazarVirtual</Text>
        <TouchableOpacity activeOpacity={0.75} onPress={finish} style={styles.skipButton}>
          <Text style={styles.skipText}>Saltar</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={listRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.title}
        renderItem={({ item }) => <Slide item={item} />}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {slides.map((slide, slideIndex) => (
            <View key={slide.title} style={[styles.dot, index === slideIndex && styles.dotActive]} />
          ))}
        </View>
        <AppButton title={index === slides.length - 1 ? 'Comenzar' : 'Siguiente'} onPress={next} fullWidth />
      </View>
    </SafeAreaView>
  );
}

function Slide({ item }) {
  return (
    <View style={styles.slide}>
      <View style={styles.iconWrap}>
        <Ionicons name={item.icon} size={64} color={colors.surface} />
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.text}>{item.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.secondary,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  brand: {
    ...typography.bodyBold,
    color: colors.surface,
  },
  skipButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  skipText: {
    ...typography.small,
    color: colors.surface,
    fontWeight: '800',
  },
  slide: {
    width: SCREEN_WIDTH_EXPORT,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconWrap: {
    width: scale(122),
    height: scale(122),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: scale(61),
    backgroundColor: 'rgba(255,255,255,0.14)',
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    color: colors.surface,
    textAlign: 'center',
  },
  text: {
    ...typography.body,
    color: colors.surface,
    opacity: 0.88,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  footer: {
    padding: spacing.md,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.primary,
  },
});
