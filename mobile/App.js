import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { fetchProfile, loginUser, registerUser } from './src/api';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

function MessageBanner({ text, type }) {
  if (!text) return null;

  const isError = type === 'error';
  const isSuccess = type === 'success';

  return (
    <View style={[styles.banner, isError && styles.bannerError, isSuccess && styles.bannerSuccess]}>
      <Text style={[styles.bannerText, isError && styles.bannerTextError]}>{text}</Text>
    </View>
  );
}

export default function App() {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const isRegisterMode = mode === 'register';

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const savedToken = await AsyncStorage.getItem(TOKEN_KEY);
        const savedUser = await AsyncStorage.getItem(USER_KEY);

        if (!savedToken) {
          setLoading(false);
          return;
        }

        setToken(savedToken);
        if (savedUser) {
          setProfile(JSON.parse(savedUser));
        }

        const data = await fetchProfile(savedToken);
        setProfile(data.user);
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
      } catch (error) {
        await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
        setToken('');
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  const subtitle = useMemo(() => {
    if (isRegisterMode) {
      return 'Create your account and jump in.';
    }
    return 'Sign in to see your secure home profile.';
  }, [isRegisterMode]);

  const clearForm = () => {
    setName('');
    setEmail('');
    setPassword('');
  };

  const showMessage = (text, type = '') => {
    setMessage({ text, type });
  };

  const switchMode = () => {
    setMode((current) => (current === 'login' ? 'register' : 'login'));
    clearForm();
    showMessage('');
  };

  const handleAuthSubmit = async () => {
    if (!email.trim() || !password.trim() || (isRegisterMode && !name.trim())) {
      showMessage('Please fill in all required fields.', 'error');
      return;
    }

    setSubmitting(true);
    showMessage('');

    try {
      if (isRegisterMode) {
        await registerUser({ name: name.trim(), email: email.trim(), password });
        showMessage('Account created. Please log in.', 'success');
        setMode('login');
        setName('');
        setPassword('');
        return;
      }

      const data = await loginUser({ email: email.trim(), password });
      setToken(data.token);
      setProfile(data.user);
      await AsyncStorage.multiSet([
        [TOKEN_KEY, data.token],
        [USER_KEY, JSON.stringify(data.user)],
      ]);
      showMessage('Login successful.', 'success');
      setPassword('');
    } catch (error) {
      showMessage(error.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const loadProfile = async () => {
    if (!token) return;

    setSubmitting(true);
    showMessage('Loading profile...');

    try {
      const data = await fetchProfile(token);
      setProfile(data.user);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
      showMessage('Profile loaded.', 'success');
    } catch (error) {
      if (/token|unauthorized|invalid|expired/i.test(error.message)) {
        await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
        setToken('');
        setProfile(null);
        showMessage('Session expired. Please login again.', 'error');
        return;
      }

      showMessage(error.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    setToken('');
    setProfile(null);
    clearForm();
    showMessage('Logged out.', 'success');
    setMode('login');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingWrap}>
        <ActivityIndicator size="large" color="#1f4f46" />
        <Text style={styles.loadingText}>Preparing your app...</Text>
        <StatusBar style="dark" />
      </SafeAreaView>
    );
  }

  const isLoggedIn = Boolean(token);

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <View style={styles.bgCircleOne} />
      <View style={styles.bgCircleTwo} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flexOne}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{isLoggedIn ? 'Home' : isRegisterMode ? 'Register' : 'Login'}</Text>
          <Text style={styles.subtitle}>{isLoggedIn ? 'Your secure profile is ready.' : subtitle}</Text>

          <MessageBanner text={message.text} type={message.type} />

          {!isLoggedIn ? (
            <View style={styles.card}>
              {isRegisterMode && (
                <View style={styles.fieldWrap}>
                  <Text style={styles.label}>Name</Text>
                  <TextInput
                    placeholder="naitik tiwari"
                    placeholderTextColor="#8a9b97"
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>
              )}

              <View style={styles.fieldWrap}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  placeholder="name@example.com"
                  placeholderTextColor="#8a9b97"
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.fieldWrap}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  placeholder="Minimum 6 characters"
                  placeholderTextColor="#8a9b97"
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              <Pressable
                disabled={submitting}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  pressed && styles.primaryBtnPressed,
                  submitting && styles.disabledBtn,
                ]}
                onPress={handleAuthSubmit}
              >
                <Text style={styles.primaryBtnText}>
                  {submitting ? 'Please wait...' : isRegisterMode ? 'Create Account' : 'Login'}
                </Text>
              </Pressable>

              <Pressable style={styles.linkBtn} onPress={switchMode}>
                <Text style={styles.linkText}>
                  {isRegisterMode ? 'Already have an account? Login' : "No account yet? Create one"}
                </Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.profileLabel}>Name</Text>
              <Text style={styles.profileValue}>{profile?.name || '-'}</Text>

              <Text style={styles.profileLabel}>Email</Text>
              <Text style={styles.profileValue}>{profile?.email || '-'}</Text>

              <Text style={styles.profileLabel}>Joined</Text>
              <Text style={styles.profileValue}>
                {profile?.created_at ? new Date(profile.created_at).toLocaleString() : '-'}
              </Text>

              <View style={styles.rowButtons}>
                <Pressable
                  disabled={submitting}
                  onPress={loadProfile}
                  style={({ pressed }) => [
                    styles.secondaryBtn,
                    pressed && styles.secondaryBtnPressed,
                    submitting && styles.disabledBtn,
                  ]}
                >
                  <Text style={styles.secondaryBtnText}>Refresh</Text>
                </Pressable>

                <Pressable onPress={handleLogout} style={({ pressed }) => [styles.ghostBtn, pressed && styles.ghostBtnPressed]}>
                  <Text style={styles.ghostBtnText}>Logout</Text>
                </Pressable>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flexOne: {
    flex: 1,
  },
  screen: {
    flex: 1,
    backgroundColor: '#f6efe4',
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingVertical: 20,
    justifyContent: 'center',
  },
  bgCircleOne: {
    position: 'absolute',
    top: -50,
    right: -30,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#f5bc76',
    opacity: 0.5,
  },
  bgCircleTwo: {
    position: 'absolute',
    bottom: 100,
    left: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#86b8ae',
    opacity: 0.45,
  },
  brand: {
    fontSize: 14,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#2d5d56',
    marginBottom: 8,
    fontWeight: '700',
  },
  title: {
    fontSize: 34,
    color: '#1f2e2b',
    fontWeight: '800',
    lineHeight: 40,
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 16,
    color: '#445653',
    fontSize: 15,
    lineHeight: 21,
  },
  card: {
    backgroundColor: '#fffdf8',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#d3ddd8',
    shadowColor: '#122422',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  fieldWrap: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    color: '#3d4f4b',
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#c4d2cd',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: '#15211e',
    backgroundColor: '#ffffff',
  },
  primaryBtn: {
    marginTop: 6,
    borderRadius: 12,
    backgroundColor: '#1f4f46',
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryBtnPressed: {
    opacity: 0.85,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  disabledBtn: {
    opacity: 0.5,
  },
  linkBtn: {
    marginTop: 12,
    alignItems: 'center',
  },
  linkText: {
    color: '#a04b2f',
    fontWeight: '700',
  },
  banner: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
    backgroundColor: '#dfeceb',
  },
  bannerError: {
    backgroundColor: '#fde6dd',
  },
  bannerSuccess: {
    backgroundColor: '#dff5e6',
  },
  bannerText: {
    color: '#23403b',
    fontWeight: '600',
  },
  bannerTextError: {
    color: '#7d2c1d',
  },
  profileLabel: {
    marginTop: 8,
    fontSize: 12,
    color: '#4f6a65',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
  },
  profileValue: {
    marginTop: 2,
    fontSize: 16,
    color: '#13211e',
    fontWeight: '600',
  },
  rowButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f4f46',
    paddingVertical: 11,
    alignItems: 'center',
    backgroundColor: '#edf5f3',
  },
  secondaryBtnPressed: {
    backgroundColor: '#e1eeeb',
  },
  secondaryBtnText: {
    color: '#1f4f46',
    fontWeight: '700',
  },
  ghostBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#af5f3f',
    paddingVertical: 11,
    alignItems: 'center',
    backgroundColor: '#fff4ee',
  },
  ghostBtnPressed: {
    opacity: 0.85,
  },
  ghostBtnText: {
    color: '#8a3f22',
    fontWeight: '700',
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f6efe4',
  },
  loadingText: {
    marginTop: 12,
    color: '#2f4c47',
    fontWeight: '600',
  },
});
