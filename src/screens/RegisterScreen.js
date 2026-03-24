import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import { supabase } from '../services/supabase';

const STORAGE_KEY = 'register_form';

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        const saved = JSON.parse(raw);
        setForm((prev) => ({
          ...prev,
          name:  saved.name  || '',
          email: saved.email || '',
          phone: saved.phone || '',
        }));
      }
    }).catch(() => {});
  }, []);

  const updateField = (field, value) => {
    const updated = { ...form, [field]: value };
    setForm(updated);
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));

    if (['name', 'email', 'phone'].includes(field)) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
        name:  field === 'name'  ? value : form.name,
        email: field === 'email' ? value : form.email,
        phone: field === 'phone' ? value : form.phone,
      })).catch(() => {});
    }
  };

  const handlePhoneChange = (value) => {
    let cleaned = value.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('8')) cleaned = '+7' + cleaned.slice(1);
    if (cleaned.startsWith('7') && !cleaned.startsWith('+7')) cleaned = '+' + cleaned;
    if (cleaned.length > 12) return;
    updateField('phone', cleaned);
  };

  const validate = () => {
    const newErrors = {};

    if (!form.name.trim()) {
      newErrors.name = 'Введите имя';
    } else if (!/^[a-zA-Zа-яёА-ЯЁ]/.test(form.name.trim())) {
      newErrors.name = 'Имя должно начинаться с буквы';
    } else if (!/^[a-zA-Zа-яёА-ЯЁ][a-zA-Zа-яёА-ЯЁ0-9 _-]*$/.test(form.name.trim())) {
      newErrors.name = 'Имя не должно содержать спецсимволы';
    }

    if (!form.email.trim()) newErrors.email = 'Введите email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Некорректный email';

    if (!form.phone.trim()) newErrors.phone = 'Введите телефон';
    else if (!/^\+7\d{10}$/.test(form.phone)) newErrors.phone = 'Формат: +79991234567 или 89991234567';

    if (!form.password) newErrors.password = 'Введите пароль';
    else if (form.password.length < 6) newErrors.password = 'Минимум 6 символов';

    if (!form.confirmPassword) newErrors.confirmPassword = 'Подтвердите пароль';
    else if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Пароли не совпадают';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);

    try {
      // 1. Регистрируем пользователя в Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      });

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          Alert.alert('Ошибка', 'Этот email уже зарегистрирован');
        } else {
          Alert.alert('Ошибка', signUpError.message);
        }
        return;
      }

      // 2. Сохраняем имя и телефон в таблицу profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: data.user.id,
          name: form.name.trim(),
          phone: form.phone,
        }]);

      if (profileError) {
        Alert.alert('Ошибка', 'Не удалось сохранить профиль');
        return;
      }

      // 3. Очищаем сохранённые данные формы
      await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});

      // App.js слушает onAuthStateChange и сам переключит на Main
      Alert.alert('Успешно', 'Аккаунт создан!');
    } catch (e) {
      Alert.alert('Ошибка', 'Нет соединения с сервером');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Регистрация</Text>
          <Text style={styles.subtitle}>Создайте аккаунт для заказа воды</Text>

          <InputField
            label="Имя"
            placeholder="Алексей Иванов"
            value={form.name}
            onChangeText={(v) => updateField('name', v)}
            error={errors.name}
          />
          <InputField
            label="Email"
            placeholder="example@mail.ru"
            value={form.email}
            onChangeText={(v) => updateField('email', v)}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <InputField
            label="Телефон"
            placeholder="+79991234567"
            value={form.phone}
            onChangeText={handlePhoneChange}
            error={errors.phone}
            keyboardType="phone-pad"
          />
          <InputField
            label="Пароль"
            placeholder="Минимум 6 символов"
            value={form.password}
            onChangeText={(v) => updateField('password', v)}
            error={errors.password}
            secureTextEntry
          />
          <InputField
            label="Подтвердите пароль"
            placeholder="Повторите пароль"
            value={form.confirmPassword}
            onChangeText={(v) => updateField('confirmPassword', v)}
            error={errors.confirmPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={COLORS.white} />
              : <Text style={styles.buttonText}>Зарегистрироваться</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.replace('Login')}
          >
            <Text style={styles.loginLinkText}>Уже есть аккаунт? Войти</Text>
          </TouchableOpacity>

          <View style={{ height: SPACING.xl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function InputField({ label, error, ...props }) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, error && styles.inputError]}
        placeholderTextColor={COLORS.textLight}
        {...props}
      />
      {error && <Text style={styles.errorText}>⚠ {error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, paddingHorizontal: SPACING.lg },
  title: {
    fontSize: FONTS.heading - 4,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: SPACING.xl,
  },
  subtitle: {
    fontSize: FONTS.body,
    color: COLORS.textLight,
    marginBottom: SPACING.lg,
  },
  fieldContainer: { marginBottom: SPACING.md },
  label: {
    fontSize: FONTS.body - 1,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    fontSize: FONTS.body - 1,
    color: COLORS.text,
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
  },
  inputError: { borderColor: '#FF3B30' },
  errorText: { fontSize: FONTS.caption, color: '#FF3B30', marginTop: 4 },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: COLORS.white, fontSize: FONTS.body, fontWeight: '700' },
  loginLink: { alignItems: 'center', paddingVertical: SPACING.lg },
  loginLinkText: { color: COLORS.primary, fontSize: FONTS.body },
});