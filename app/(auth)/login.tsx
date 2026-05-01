import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Theme } from '@/constants/Theme';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleLogin = () => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');

    if (!email || !email.includes('@')) {
      setEmailError('Ingresa un correo electrónico válido');
      isValid = false;
    }
    if (!password) {
      setPasswordError('La contraseña es requerida');
      isValid = false;
    }

    if (isValid) {
      // In a real app we'd validate against a backend
      router.replace('/(tabs)');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>GIBOR SHOP</Text>
            <Text style={styles.subtitle}>Bienvenido de nuevo</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Email"
              iconName="mail"
              placeholder="tu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              error={emailError}
            />

            <Input
              label="Contraseña"
              iconName="lock"
              placeholder="••••••••"
              secureTextEntry={!showPassword}
              rightIconName={showPassword ? 'visibility' : 'visibility-off'}
              onRightIconPress={() => setShowPassword(!showPassword)}
              value={password}
              onChangeText={setPassword}
              error={passwordError}
            />

            <View style={styles.optionsRow}>
              <TouchableOpacity 
                style={styles.checkboxContainer} 
                onPress={() => setRememberMe(!rememberMe)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe && <MaterialIcons name="check" size={14} color={Theme.colors.onPrimary} />}
                </View>
                <Text style={styles.checkboxLabel}>Recordarme</Text>
              </TouchableOpacity>

              <TouchableOpacity>
                <Text style={styles.forgotPassword}>¿Olvidaste tu contraseña?</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.loginButton} activeOpacity={0.9} onPress={handleLogin}>
              <Text style={styles.loginButtonText}>Iniciar sesión</Text>
              <MaterialIcons name="arrow-forward" size={20} color={Theme.colors.onPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>O continuar con</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialButtonsContainer}>
            <TouchableOpacity style={styles.socialButton} activeOpacity={0.8}>
              {/* Google uses a specific icon, we will just use a letter for now or an image if available */}
              <Text style={[styles.socialIconText, { color: '#db4437' }]}>G</Text>
              <Text style={styles.socialButtonText}>Google</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton} activeOpacity={0.8}>
              <MaterialIcons name="apple" size={20} color={Theme.colors.onSurface} style={{ marginRight: 8 }} />
              <Text style={styles.socialButtonText}>Apple</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>¿No tienes cuenta? </Text>
            <TouchableOpacity>
              <Text style={styles.registerLink}>Regístrate</Text>
            </TouchableOpacity>
          </View>

        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Theme.spacing.md,
  },
  card: {
    padding: Theme.spacing.xl,
    borderRadius: Theme.rounded.lg,
    backgroundColor: Theme.colors.surface,
  },
  header: {
    alignItems: 'center',
    marginBottom: Theme.spacing.xl,
  },
  title: {
    fontFamily: 'Inter',
    fontSize: 32,
    fontWeight: '900',
    color: Theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: -0.5,
  },
  subtitle: {
    ...Theme.typography.bodyMd,
    color: Theme.colors.onSurfaceVariant,
    marginTop: Theme.spacing.sm,
  },
  form: {
    width: '100%',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Theme.spacing.xs,
    marginBottom: Theme.spacing.lg,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: Theme.colors.outline,
    borderRadius: 4,
    marginRight: Theme.spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  checkboxLabel: {
    ...Theme.typography.bodySm,
    color: Theme.colors.onSurfaceVariant,
  },
  forgotPassword: {
    ...Theme.typography.labelMd,
    color: Theme.colors.primary,
  },
  loginButton: {
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.rounded.base,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
    marginTop: Theme.spacing.sm,
  },
  loginButtonText: {
    ...Theme.typography.labelLg,
    color: Theme.colors.onPrimary,
    marginRight: Theme.spacing.xs,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Theme.spacing.xl,
    marginBottom: Theme.spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Theme.colors.surfaceVariant,
  },
  dividerText: {
    ...Theme.typography.bodySm,
    color: Theme.colors.onSurfaceVariant,
    paddingHorizontal: Theme.spacing.md,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.outline,
    borderRadius: Theme.rounded.base,
    paddingVertical: Theme.spacing.sm,
    backgroundColor: Theme.colors.surface,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  socialButtonText: {
    ...Theme.typography.labelMd,
    color: Theme.colors.onSurface,
  },
  socialIconText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Theme.spacing.xl,
  },
  footerText: {
    ...Theme.typography.bodySm,
    color: Theme.colors.onSurfaceVariant,
  },
  registerLink: {
    ...Theme.typography.labelMd,
    color: Theme.colors.primary,
  },
});
