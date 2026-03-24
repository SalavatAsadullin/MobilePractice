import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import { supabase } from '../services/supabase';

const TIME_SLOTS = ['09:00–11:00', '11:00–13:00', '13:00–15:00', '15:00–17:00', '17:00–19:00'];
const STORAGE_KEY = 'order_form';

export default function OrderScreen({ route, navigation }) {
  const { product } = route.params;

  const [form, setForm] = useState({ address: '', phone: '', comment: '' });
  const [quantity, setQuantity] = useState(1);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadSaved = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          setForm({
            address: saved.address || '',
            phone:   saved.phone   || '',
            comment: saved.comment || '',
          });
          if (saved.quantity) setQuantity(saved.quantity);
          if (saved.selectedSlot) setSelectedSlot(saved.selectedSlot);
        } else {
          // Подставляем телефон из профиля пользователя
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('phone')
              .eq('id', user.id)
              .single();
            if (profile?.phone) {
              setForm((prev) => ({ ...prev, phone: profile.phone }));
            }
          }
        }
      } catch (_) {}
    };
    loadSaved();
  }, []);

  const saveToStorage = (updatedForm, updatedQuantity, updatedSlot) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
      address:      updatedForm.address,
      phone:        updatedForm.phone,
      comment:      updatedForm.comment,
      quantity:     updatedQuantity,
      selectedSlot: updatedSlot,
    })).catch(() => {});
  };

  const handlePhoneChange = (value) => {
    let cleaned = value.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('8')) cleaned = '+7' + cleaned.slice(1);
    if (cleaned.startsWith('7') && !cleaned.startsWith('+7')) cleaned = '+' + cleaned;
    if (cleaned.length > 12) return;
    updateField('phone', cleaned);
  };

  const handleAddressChange = (value) => {
    if (value.length > 100) return;
    updateField('address', value);
  };

  const updateField = (field, value) => {
    const updated = { ...form, [field]: value };
    setForm(updated);
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
    saveToStorage(updated, quantity, selectedSlot);
  };

  const changeQuantity = (delta) => {
    const next = Math.max(1, quantity + delta);
    setQuantity(next);
    saveToStorage(form, next, selectedSlot);
  };

  const changeSlot = (slot) => {
    setSelectedSlot(slot);
    setErrors((prev) => ({ ...prev, slot: null }));
    saveToStorage(form, quantity, slot);
  };

  const validate = () => {
    const newErrors = {};
    if (!form.address.trim()) newErrors.address = 'Введите адрес доставки';
    else if (form.address.trim().length < 5) newErrors.address = 'Адрес слишком короткий';
    if (!form.phone.trim()) newErrors.phone = 'Введите телефон';
    else if (!/^\+7\d{10}$/.test(form.phone)) newErrors.phone = 'Формат: +79991234567 или 89991234567';
    if (!selectedSlot) newErrors.slot = 'Выберите время доставки';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOrder = async () => {
    if (!validate()) return;
    setLoading(true);

    try {
      // Получаем текущего авторизованного пользователя
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert('Ошибка', 'Сессия истекла, войдите снова');
        return;
      }

      // Отправляем заказ в Supabase, привязываем к user_id
      const { error } = await supabase.from('orders').insert([{
        user_id:   user.id,
        brand:     product.brand,
        volume:    product.volume,
        price:     product.price,
        address:   form.address.trim(),
        phone:     form.phone,
        quantity,
        time_slot: selectedSlot,
        comment:   form.comment.trim(),
      }]);

      if (error) {
        Alert.alert('Ошибка', 'Не удалось оформить заказ. Попробуйте ещё раз.');
        return;
      }

      await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});

      Alert.alert(
        '🎉 Заказ оформлен!',
        `${product.brand} ${product.volume} × ${quantity}\nДоставка: ${selectedSlot}\nСумма: ${product.price * quantity} ₽`,
        [{ text: 'Отлично!', onPress: () => navigation.navigate('Main', { screen: 'Profile' }) }]
      );
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

          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>← Назад</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Оформление заказа</Text>

          <View style={styles.productCard}>
            <Text style={styles.productEmoji}>{product.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.productBrand}>{product.brand}</Text>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productPrice}>{product.price} ₽ / шт</Text>
            </View>
          </View>

          <Text style={styles.sectionLabel}>Количество</Text>
          <View style={styles.quantityRow}>
            <TouchableOpacity style={styles.qtyButton} onPress={() => changeQuantity(-1)}>
              <Text style={styles.qtyButtonText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.qtyValue}>{quantity}</Text>
            <TouchableOpacity style={styles.qtyButton} onPress={() => changeQuantity(1)}>
              <Text style={styles.qtyButtonText}>+</Text>
            </TouchableOpacity>
            <Text style={styles.totalPrice}>= {product.price * quantity} ₽</Text>
          </View>

          <Text style={styles.sectionLabel}>
            Адрес доставки{' '}
            <Text style={styles.charCount}>{form.address.length}/100</Text>
          </Text>
          <TextInput
            style={[styles.input, errors.address && styles.inputError]}
            placeholder="ул. Ленина, д. 1, кв. 10"
            placeholderTextColor={COLORS.textLight}
            value={form.address}
            onChangeText={handleAddressChange}
            autoComplete="off"
            autoCorrect={false}
            autoCapitalize="none"
            importantForAutofill="no"
          />
          {errors.address && <Text style={styles.errorText}>⚠ {errors.address}</Text>}

          <Text style={styles.sectionLabel}>
            Телефон{' '}
            <Text style={styles.charCount}>{form.phone.length}/12</Text>
          </Text>
          <TextInput
            style={[styles.input, errors.phone && styles.inputError]}
            placeholder="+79991234567"
            placeholderTextColor={COLORS.textLight}
            value={form.phone}
            onChangeText={handlePhoneChange}
            keyboardType="phone-pad"
            autoComplete="off"
            autoCorrect={false}
            importantForAutofill="no"
          />
          {errors.phone && <Text style={styles.errorText}>⚠ {errors.phone}</Text>}

          <Text style={styles.sectionLabel}>Время доставки</Text>
          <View style={styles.slotsGrid}>
            {TIME_SLOTS.map((slot) => (
              <TouchableOpacity
                key={slot}
                style={[styles.slot, selectedSlot === slot && styles.slotActive]}
                onPress={() => changeSlot(slot)}
              >
                <Text style={[styles.slotText, selectedSlot === slot && styles.slotTextActive]}>
                  {slot}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.slot && <Text style={styles.errorText}>⚠ {errors.slot}</Text>}

          <Text style={styles.sectionLabel}>
            Комментарий (необязательно){' '}
            <Text style={styles.charCount}>{form.comment.length}/200</Text>
          </Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Код домофона, этаж, пожелания..."
            placeholderTextColor={COLORS.textLight}
            value={form.comment}
            onChangeText={(v) => {
              if (v.length > 200) return;
              updateField('comment', v);
            }}
            multiline
            numberOfLines={3}
            autoComplete="off"
            autoCorrect={false}
            importantForAutofill="no"
          />

          <TouchableOpacity
            style={[styles.orderButton, loading && styles.buttonDisabled]}
            onPress={handleOrder}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={COLORS.white} />
              : <Text style={styles.orderButtonText}>
                  Оформить заказ — {product.price * quantity} ₽
                </Text>
            }
          </TouchableOpacity>

          <View style={{ height: SPACING.xl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, paddingHorizontal: SPACING.lg },
  backButton: { marginTop: SPACING.md },
  backText: { fontSize: FONTS.body, color: COLORS.primary },
  title: {
    fontSize: FONTS.heading - 4, fontWeight: 'bold',
    color: COLORS.primary, marginTop: SPACING.sm, marginBottom: SPACING.md,
  },
  productCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: 14,
    padding: SPACING.md, marginBottom: SPACING.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  productEmoji: { fontSize: 36, marginRight: SPACING.md },
  productBrand: { fontSize: FONTS.body, fontWeight: '700', color: COLORS.primary },
  productName: { fontSize: FONTS.caption, color: COLORS.text },
  productPrice: { fontSize: FONTS.body - 1, color: COLORS.textLight },
  sectionLabel: {
    fontSize: FONTS.body - 1, fontWeight: '600',
    color: COLORS.text, marginBottom: 8, marginTop: SPACING.sm,
  },
  charCount: { fontSize: FONTS.caption, color: COLORS.textLight, fontWeight: '400' },
  quantityRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  qtyButton: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
  qtyButtonText: { fontSize: 22, color: COLORS.white, fontWeight: 'bold' },
  qtyValue: {
    fontSize: FONTS.subheading, fontWeight: 'bold',
    color: COLORS.text, marginHorizontal: SPACING.md,
  },
  totalPrice: {
    fontSize: FONTS.subheading - 2, fontWeight: '700',
    color: COLORS.primary, marginLeft: SPACING.md,
  },
  input: {
    backgroundColor: COLORS.white, borderRadius: 12,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm + 4,
    fontSize: FONTS.body - 1, color: COLORS.text,
    borderWidth: 1.5, borderColor: '#E5E5EA', marginBottom: 4,
  },
  inputError: { borderColor: '#FF3B30' },
  textArea: { height: 80, textAlignVertical: 'top' },
  errorText: { fontSize: FONTS.caption, color: '#FF3B30', marginBottom: SPACING.sm },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: 4 },
  slot: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderRadius: 10, borderWidth: 1.5, borderColor: '#E5E5EA',
    backgroundColor: COLORS.white,
  },
  slotActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  slotText: { fontSize: FONTS.caption, color: COLORS.text, fontWeight: '600' },
  slotTextActive: { color: COLORS.white },
  orderButton: {
    backgroundColor: COLORS.primary, paddingVertical: SPACING.md,
    borderRadius: 14, alignItems: 'center', marginTop: SPACING.lg,
  },
  buttonDisabled: { opacity: 0.6 },
  orderButtonText: { color: COLORS.white, fontSize: FONTS.body, fontWeight: '700' },
});