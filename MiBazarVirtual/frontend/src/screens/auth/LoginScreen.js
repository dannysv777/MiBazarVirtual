import { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppButton from '../../components/common/AppButton';
import FocusAwareStatusBar from '../../components/common/FocusAwareStatusBar';
import AppInput from '../../components/common/AppInput';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, typography } from '../../theme';
import { getErrorMessage } from '../../utils/apiResponse';
import { hp, scale } from '../../utils/responsive';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const scrollRef = useRef(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    let scrollTimer = null;

    const showSubscription = Keyboard.addListener(showEvent, () => {
      setKeyboardVisible(true);
      scrollTimer = setTimeout(() => {
        scrollRef.current?.scrollTo({ y: scale(35), animated: true });
      }, 80);
    });

    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardVisible(false);
      if (scrollTimer) clearTimeout(scrollTimer);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    });

    return () => {
      if (scrollTimer) clearTimeout(scrollTimer);
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

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
      <FocusAwareStatusBar style="dark" backgroundColor="transparent" translucent />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            keyboardVisible && styles.scrollContentKeyboard,
          ]}
        >
          <View style={[styles.topSection, keyboardVisible && styles.topSectionKeyboard]}>
            <Text style={[styles.logo, keyboardVisible && styles.logoKeyboard]}>🛒</Text>
            <Text style={styles.brand}>MiBazarVirtual</Text>
            {!keyboardVisible ? <Text style={styles.tagline}>Tu mercado local</Text> : null}
          </View>

          <View style={[styles.form, keyboardVisible && styles.formKeyboard]}>
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
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    backgroundColor: colors.surface,
    paddingBottom: scale(120),
  },
  scrollContentKeyboard: {
    paddingBottom: scale(150),
  },
  topSection: {
    minHeight: hp(28),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
    borderBottomLeftRadius: scale(32),
    borderBottomRightRadius: scale(32),
    paddingHorizontal: spacing.md,
  },
  topSectionKeyboard: {
    minHeight: hp(22),
    borderBottomLeftRadius: scale(22),
    borderBottomRightRadius: scale(22),
  },
  logo: {
    fontSize: 48,
    marginBottom: spacing.xs,
  },
  logoKeyboard: {
    fontSize: 30,
    marginBottom: 0,
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
    flexGrow: 1,
    padding: spacing.md,
  },
  formKeyboard: {
    paddingTop: spacing.sm,
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
