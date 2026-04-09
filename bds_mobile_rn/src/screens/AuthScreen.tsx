import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { authApi } from '../api/authApi';
import { userSession } from '../state/userSession';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Auth'>;

export function AuthScreen({ navigation }: Props) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Customer' | 'Staff'>('Customer');

  const onContinue = async () => {
    setErrorText(null);
    const em = email.trim();
    const pw = password.trim();
    const displayName = name.trim() || 'Guest User';

    if (!em || !pw) {
      setErrorText('Email and password are required.');
      return;
    }
    if (!isLogin && pw.length < 8) {
      setErrorText('Password must be at least 8 characters (same as server rule).');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const res = await authApi.login(em, pw);
        userSession.userId = res.user.id;
        userSession.userName = res.user.fullName || 'Guest User';
        userSession.email = res.user.email;
        userSession.role = res.user.role;
        userSession.token = res.token;
      } else {
        await authApi.register({
          fullName: displayName,
          email: em,
          password: pw,
          role,
        });
        const res = await authApi.login(em, pw);
        userSession.userId = res.user.id;
        userSession.userName = res.user.fullName || displayName;
        userSession.email = res.user.email;
        userSession.role = res.user.role;
        userSession.token = res.token;
      }
      if (name.trim().length > 0) {
        userSession.userName = name.trim();
      }
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setErrorText(msg.replace(/^Error:\s*/, ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>BDS Smart Branch App</Text>
      <Text style={styles.hint}>
        Requires bds_backend on HTTP port 5062 (set EXPO_PUBLIC_API_BASE_URL on a real device)
      </Text>

      <View style={styles.segment}>
        <Pressable
          style={[styles.segBtn, isLogin && styles.segActive]}
          onPress={() => setIsLogin(true)}
        >
          <Text style={[styles.segText, isLogin && styles.segTextActive]}>Login</Text>
        </Pressable>
        <Pressable
          style={[styles.segBtn, !isLogin && styles.segActive]}
          onPress={() => setIsLogin(false)}
        >
          <Text style={[styles.segText, !isLogin && styles.segTextActive]}>Register</Text>
        </Pressable>
      </View>

      {!isLogin && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
          <Text style={styles.label}>Role</Text>
          <View style={styles.roleRow}>
            <Pressable
              style={[styles.roleChip, role === 'Customer' && styles.roleChipOn]}
              onPress={() => setRole('Customer')}
            >
              <Text>Customer</Text>
            </Pressable>
            <Pressable
              style={[styles.roleChip, role === 'Staff' && styles.roleChipOn]}
              onPress={() => setRole('Staff')}
            >
              <Text>Staff</Text>
            </Pressable>
          </View>
        </>
      )}

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {errorText ? <Text style={styles.error}>{errorText}</Text> : null}

      <Pressable
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={onContinue}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{isLogin ? 'Login' : 'Create Account'}</Text>
        )}
      </Pressable>
      {loading ? <Text style={styles.wait}>Please wait...</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 48 },
  title: { fontSize: 22, fontWeight: '600', marginBottom: 8 },
  hint: { color: '#666', fontSize: 12, marginBottom: 24 },
  segment: { flexDirection: 'row', marginBottom: 20, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#ccc' },
  segBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: '#f5f5f5' },
  segActive: { backgroundColor: '#3F51B5' },
  segText: { color: '#333' },
  segTextActive: { color: '#fff', fontWeight: '600' },
  label: { marginBottom: 6, fontWeight: '500' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  roleRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  roleChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#ccc' },
  roleChipOn: { backgroundColor: '#E8EAF6', borderColor: '#3F51B5' },
  error: { color: '#c00', marginBottom: 10 },
  button: { backgroundColor: '#3F51B5', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  wait: { textAlign: 'center', marginTop: 8, color: '#666' },
});
