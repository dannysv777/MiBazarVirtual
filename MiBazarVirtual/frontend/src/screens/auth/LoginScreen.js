import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppButton from '../../components/common/AppButton';
import AppInput from '../../components/common/AppInput';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, typography } from '../../theme';
import { getErrorMessage } from '../../utils/apiResponse';
import { hp, scale } from '../../utils/responsive';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      await login(email.trim(), password);
    } catch (loginError) {
      setError(getErrorMessage(loginError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor="transparent" translucent />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
      <View style={styles.topSection}>
        <Text style={styles.logo}>🛒</Text>
        <Text style={styles.brand}>MiBazarVirtual</Text>
        <Text style={styles.tagline}>Tu mercado local</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.title}>Bienvenido de nuevo</Text>
        <Text style={styles.subtitle}>Ingresa para continuar</Text>

        <View style={styles.spacer} />

        <AppInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          leftIcon="mail-outline"
        />
        <AppInput
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          leftIcon="lock-closed-outline"
          rightIcon={{
            name: showPassword ? 'eye-off-outline' : 'eye-outline',
            onPress: () => setShowPassword((current) => !current),
          }}
        />

        {error ? <Text style={styles.errorCard}>{error}</Text> : null}

        <View style={styles.buttonSpacer} />
        <AppButton title="Iniciar Sesión" onPress={handleLogin} loading={loading} fullWidth />

        <View style={styles.registerRow}>
          <Text style={styles.registerText}>¿No tienes cuenta?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')} activeOpacity={0.7}>
            <Text style={styles.registerLink}> Registrarse</Text>
          </TouchableOpacity>
        </View>
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  keyboardView: {
    flex: 1,
  },
  topSection: {
    height: hp(28),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
    borderBottomLeftRadius: scale(32),
    borderBottomRightRadius: scale(32),
  },
  logo: {
    fontSize: 48,
    marginBottom: spacing.xs,
  },
  brand: {
    ...typography.h2,
    color: colors.surface,
  },
  tagline: {
    ...typography.small,
    color: colors.surface,
    marginTop: spacing.xs,
  },
  form: {
    flex: 1,
    padding: spacing.md,
  },
  title: {
    ...typography.h3,
  },
  subtitle: {
    ...typography.small,
    marginTop: spacing.xs,
  },
  spacer: {
    height: spacing.lg,
  },
  buttonSpacer: {
    height: spacing.sm,
  },
  errorCard: {
    ...typography.small,
    color: colors.error,
    backgroundColor: '#FFE9E8',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  registerText: {
    ...typography.small,
  },
  registerLink: {
    ...typography.small,
    color: colors.primary,
    fontWeight: '700',
  },
});
