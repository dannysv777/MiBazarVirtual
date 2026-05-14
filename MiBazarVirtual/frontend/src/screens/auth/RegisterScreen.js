import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import AppButton from '../../components/common/AppButton';
import AppInput from '../../components/common/AppInput';
import { useAuth } from '../../context/AuthContext';
import { colors, shadows, spacing, typography } from '../../theme';
import { getErrorMessage } from '../../utils/apiResponse';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [role, setRole] = useState('BUYER');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const nextErrors = {};

    if (!fullName || !email || !phone || !password || !confirmPassword) {
      nextErrors.form = 'Todos los campos son requeridos';
    }

    if (email && !emailRegex.test(email)) {
      nextErrors.email = 'Email inválido';
    }

    if (password && password.length < 6) {
      nextErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (password && confirmPassword && password !== confirmPassword) {
      nextErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    if (!fullName) nextErrors.fullName = nextErrors.form;
    if (!email) nextErrors.email = nextErrors.form;
    if (!phone) nextErrors.phone = nextErrors.form;
    if (!password) nextErrors.password = nextErrors.form;
    if (!confirmPassword) nextErrors.confirmPassword = nextErrors.form;

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setLoading(true);
    setServerError('');

    try {
      await register({
        username: email.trim(),
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        phone: phone.trim(),
        role,
      });
    } catch (registerError) {
      setServerError(getErrorMessage(registerError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Crea tu cuenta</Text>
        <Text style={styles.subtitle}>Elige cómo usarás MiBazarVirtual</Text>

        <View style={styles.roleRow}>
          <RoleCard emoji="🛒" title="Soy Comprador" selected={role === 'BUYER'} onPress={() => setRole('BUYER')} />
          <RoleCard emoji="🏪" title="Soy Vendedor" selected={role === 'SELLER'} onPress={() => setRole('SELLER')} />
        </View>

        <AppInput
          label="Nombre completo"
          value={fullName}
          onChangeText={setFullName}
          autoCapitalize="words"
          error={errors.fullName}
        />
        <AppInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.email}
        />
        <AppInput
          label="Teléfono"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          error={errors.phone}
        />
        <AppInput
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          error={errors.password}
          rightIcon={{
            name: showPassword ? 'eye-off-outline' : 'eye-outline',
            onPress: () => setShowPassword((current) => !current),
          }}
        />
        <AppInput
          label="Confirmar contraseña"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showConfirmPassword}
          error={errors.confirmPassword}
          rightIcon={{
            name: showConfirmPassword ? 'eye-off-outline' : 'eye-outline',
            onPress: () => setShowConfirmPassword((current) => !current),
          }}
        />

        {serverError ? <Text style={styles.errorCard}>{serverError}</Text> : null}

        <AppButton title="Crear cuenta" onPress={handleRegister} loading={loading} fullWidth />

        <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('Login')} style={styles.backLink}>
          <Text style={styles.backText}>¿Ya tienes cuenta? Inicia sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function RoleCard({ emoji, title, selected, onPress }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.roleCard, selected ? styles.roleCardSelected : styles.roleCardIdle]}
    >
      <Text style={styles.roleEmoji}>{emoji}</Text>
      <Text style={styles.roleTitle}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    padding: spacing.md,
    paddingTop: spacing.xl,
  },
  title: {
    ...typography.h2,
  },
  subtitle: {
    ...typography.small,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  roleRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  roleCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 12,
    ...shadows.card,
  },
  roleCardSelected: {
    backgroundColor: colors.primaryLight,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  roleCardIdle: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleEmoji: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  roleTitle: {
    ...typography.bodyBold,
    textAlign: 'center',
  },
  errorCard: {
    ...typography.small,
    color: colors.error,
    backgroundColor: '#FFE9E8',
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  backLink: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  backText: {
    ...typography.small,
    color: colors.primary,
    fontWeight: '700',
  },
});
