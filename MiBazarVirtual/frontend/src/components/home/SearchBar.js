import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { colors, spacing, typography } from '../../theme';

export default function SearchBar({
  value,
  onChangeText,
  onSubmit,
  onPress,
  placeholder = 'Buscar productos...',
  editable = true,
}) {
  const content = (
    <View style={styles.container}>
      <Ionicons name="search-outline" size={20} color={colors.textSecondary} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        editable={editable}
        returnKeyType="search"
        style={styles.input}
      />
    </View>
  );

  if (onPress && !editable) {
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  input: {
    ...typography.body,
    flex: 1,
    marginLeft: spacing.sm,
    paddingVertical: 0,
  },
});
