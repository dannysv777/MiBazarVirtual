import { StyleSheet, Text, View } from 'react-native';

import { colors, typography } from '../../theme';

const variants = {
  success: { backgroundColor: '#E8F8ED', color: colors.success },
  warning: { backgroundColor: '#FFF4E5', color: colors.warning },
  error: { backgroundColor: '#FFE9E8', color: colors.error },
  accent: { backgroundColor: '#E7F7EF', color: colors.accent },
  primary: { backgroundColor: colors.primaryLight, color: colors.primary },
  info: { backgroundColor: '#3B82F6', color: colors.surface },
  gray: { backgroundColor: colors.background, color: colors.textSecondary },
};

export default function AppBadge({ label, variant = 'primary' }) {
  const palette = variants[variant] ?? variants.primary;

  return (
    <View style={[styles.badge, { backgroundColor: palette.backgroundColor }]}>
      <Text style={[styles.text, { color: palette.color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  text: {
    ...typography.tiny,
    fontWeight: '700',
  },
});
