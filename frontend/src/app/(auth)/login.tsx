import type { ApiError } from '@/api/client';
import { useAuth } from '@/auth/useAuth';
import { Button } from '@/components/ui/Button';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { TextField } from '@/components/ui/TextField';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';

export default function LoginScreen() {
  const { login, loginAsDevUser } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.replace('/modules');
    } catch (err) {
      setError((err as ApiError).detail);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDevLogin() {
    setError(null);
    setSubmitting(true);
    try {
      await loginAsDevUser();
      router.replace('/modules');
    } catch (err) {
      setError((err as ApiError).detail);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 items-center justify-center bg-slate-50 p-4">
      <View className="w-full max-w-sm gap-4 rounded-lg border border-slate-200 bg-white p-6">
        <Text className="text-xl font-semibold text-slate-900">Log in</Text>
        <ErrorBanner message={error} />
        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
        />
        <TextField
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />
        <Button onPress={handleSubmit} disabled={submitting}>
          Log in
        </Button>
        <View className="flex-row justify-center gap-1">
          <Text className="text-sm text-slate-600">No account?</Text>
          <Link href="/register">
            <Text className="text-sm font-medium text-slate-900">Register</Text>
          </Link>
        </View>
        {__DEV__ && (
          <Button variant="secondary" onPress={handleDevLogin} disabled={submitting}>
            Continue as dev user (skip sign-in)
          </Button>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
