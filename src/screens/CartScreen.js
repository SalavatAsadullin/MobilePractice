import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import { useAppContext } from '../context/AppContext';
import { supabase } from '../services/supabase';

const TIME_SLOTS = ['09:00-11:00', '11:00-13:00', '13:00-15:00', '15:00-17:00', '17:00-19:00'];

export default function CartScreen({ navigation }) {
  const { cart, cartTotal, updateCartQuantity, removeFromCart, clearCart, user } = useAppContext();
  const [form, setForm] = useState({
    street: '',
    house: '',
    entrance: '',
    floor: '',
    apartment: '',
    phone: '',
    comment: '',
  });
  const [exchangeQty, setExchangeQty] = useState('');
  const [deliveryDay, setDeliveryDay] = useState('Сегодня');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (user?.phone) {
      setForm((prev) => ({ ...prev, phone: prev.phone || user.phone }));
    }
  }, [user]);

  const isEmpty = cart.length === 0;
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const exchangeCount = Number(exchangeQty || 0);
  const discountTotal = exchangeCount * 200;
  const finalTotal = Math.max(0, cartTotal - discountTotal);

  useEffect(() => {
    if (exchangeQty !== '' && Number(exchangeQty) > totalItems) {
      setExchangeQty(String(totalItems));
      if (errors.exchangeQty) setErrors((prev) => ({ ...prev, exchangeQty: null }));
    }
  }, [exchangeQty, totalItems, errors.exchangeQty]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handlePhoneChange = (value) => {
    let cleaned = value.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('8')) cleaned = '+7' + cleaned.slice(1);
    if (cleaned.startsWith('7') && !cleaned.startsWith('+7')) cleaned = '+' + cleaned;
    if (cleaned.length > 12) return;
    updateField('phone', cleaned);
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.street.trim()) nextErrors.street = 'Введите улицу';
    else if (form.street.trim().length < 3) nextErrors.street = 'Улица слишком короткая';
    if (!form.house.trim()) nextErrors.house = 'Введите номер дома';
    if (!form.phone.trim()) nextErrors.phone = 'Введите телефон';
    else if (!/^\+7\d{10}$/.test(form.phone)) nextErrors.phone = 'Формат: +79991234567 или 89991234567';
    if (!selectedSlot) nextErrors.slot = 'Выберите время доставки';
    if (!deliveryDay) nextErrors.deliveryDay = 'Выберите день доставки';
    if (exchangeQty === '') nextErrors.exchangeQty = 'Укажите бутыли на обмен';
    else if (!/^\d+$/.test(exchangeQty)) nextErrors.exchangeQty = 'Только целое число';
    else if (Number(exchangeQty) > totalItems) nextErrors.exchangeQty = 'Не может быть больше количества';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleDetectLocation = async () => {
    try {
      setLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Нет доступа', 'Разрешите доступ к геолокации в настройках устройства');
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = position.coords;
      let street = '';
      let house = '';

      try {
        const reverse = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (reverse?.length) {
          const geo = reverse[0];
          const rawStreet = (geo.street || geo.name || '').trim();
          // Убираем тип улицы, чтобы оставалось только название (например, "Заикина")
          street = rawStreet.replace(
            /^(улица|ул\.?|проспект|пр-т|просп\.?|переулок|пер\.?|бульвар|бул\.?|шоссе|наб\.?|набережная|площадь|пл\.?)\s+/i,
            ''
          );
          house = (geo.streetNumber || '').trim();
        }
      } catch (_) {
        // Если обратное геокодирование не сработало, оставляем поля для ручного ввода.
      }

      if (!street) {
        street = `Координаты ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      }

      updateField('street', street.slice(0, 80));
      updateField('house', house.slice(0, 15));
      setErrors((prev) => ({ ...prev, street: null, house: null }));
    } catch (_) {
      Alert.alert('Ошибка', 'Не удалось определить местоположение');
    } finally {
      setLocating(false);
    }
  };

  const handleCheckout = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        Alert.alert('Ошибка', 'Сессия истекла, войдите снова');
        return;
      }

      // Разбиваем обмен между позициями корзины последовательно
      let remainingExchange = exchangeCount;
      const composedAddress = [
        form.street.trim(),
        form.house.trim(),
        form.entrance.trim() ? `подъезд ${form.entrance.trim()}` : '',
        form.floor.trim() ? `этаж ${form.floor.trim()}` : '',
        form.apartment.trim() ? `кв. ${form.apartment.trim()}` : '',
      ]
        .filter(Boolean)
        .join(', ');
      const rows = cart.map((item) => {
        const localExchange = Math.min(item.quantity, remainingExchange);
        remainingExchange -= localExchange;
        return {
          user_id: authUser.id,
          brand: item.product.brand,
          volume: item.product.volume,
          price: item.product.price,
          unit_price: item.product.price,
          address: composedAddress,
          phone: form.phone,
          quantity: item.quantity,
          exchange_qty: localExchange,
          delivery_day: deliveryDay,
          time_slot: selectedSlot,
          comment: form.comment.trim(),
        };
      });

      const { error } = await supabase.from('orders').insert(rows);
      if (error) {
        Alert.alert('Ошибка', 'Не удалось оформить заказ. Попробуйте ещё раз.');
        return;
      }

      clearCart();
      setForm((prev) => ({
        ...prev,
        street: '',
        house: '',
        entrance: '',
        floor: '',
        apartment: '',
        comment: '',
      }));
      setExchangeQty('');
      setSelectedSlot(null);

      Alert.alert(
        '🎉 Заказ оформлен!',
        `Товаров: ${totalItems}\nОбмен: ${exchangeCount}\nСкидка: ${discountTotal} ₽\nДень: ${deliveryDay}\nДоставка: ${selectedSlot}\nСумма: ${finalTotal} ₽`,
        [{ text: 'Отлично!' }]
      );
    } catch (_) {
      Alert.alert('Ошибка', 'Нет соединения с сервером');
    } finally {
      setLoading(false);
    }
  };

  if (isEmpty) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text style={styles.emptyTitle}>Корзина пуста</Text>
          <Text style={styles.emptySubtitle}>Добавьте товары из каталога, чтобы оформить заказ</Text>
          <TouchableOpacity
            style={styles.catalogButton}
            onPress={() => navigation.navigate('Catalog')}
          >
            <Text style={styles.catalogButtonText}>Перейти в каталог</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Корзина</Text>

          {cart.map((item) => (
            <View key={item.product.id} style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.emoji}>{item.product.emoji}</Text>
                <View style={styles.info}>
                  <Text style={styles.brand}>{item.product.brand}</Text>
                  <Text style={styles.name}>{item.product.name}</Text>
                  <Text style={styles.price}>{item.product.price} ₽ / шт</Text>
                </View>
              </View>

              <View style={styles.controlsRow}>
                <View style={styles.quantityControls}>
                  <TouchableOpacity
                    style={styles.qtyButton}
                    onPress={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                  >
                    <Text style={styles.qtyButtonText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.quantity}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={styles.qtyButton}
                    onPress={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                  >
                    <Text style={styles.qtyButtonText}>+</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={() => removeFromCart(item.product.id)}>
                  <Text style={styles.removeText}>Удалить</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.itemTotal}>
                Итого: {item.product.price * item.quantity} ₽
              </Text>
            </View>
          ))}

          <View style={styles.summary}>
            <Text style={styles.summaryText}>Сумма заказа: {finalTotal} ₽</Text>
            <Text style={styles.summarySubtext}>Скидка по обмену: {discountTotal} ₽</Text>
          </View>

          <Text style={styles.sectionLabel}>Бутыли на обмен</Text>
          <TextInput
            style={[styles.input, errors.exchangeQty && styles.inputError]}
            placeholder="0"
            placeholderTextColor={COLORS.textLight}
            value={exchangeQty}
            onChangeText={(v) => {
              if (v === '') {
                setExchangeQty('');
                if (errors.exchangeQty) setErrors((prev) => ({ ...prev, exchangeQty: null }));
                return;
              }
              if (!/^\d+$/.test(v)) return;
              if (Number(v) > totalItems) return;
              setExchangeQty(v);
              if (errors.exchangeQty) setErrors((prev) => ({ ...prev, exchangeQty: null }));
            }}
            keyboardType="number-pad"
          />
          {errors.exchangeQty && <Text style={styles.errorText}>⚠ {errors.exchangeQty}</Text>}

          <Text style={styles.sectionLabel}>
            Улица <Text style={styles.charCount}>{form.street.length}/80</Text>
          </Text>
          <TouchableOpacity
            style={[styles.geoButton, locating && styles.buttonDisabled]}
            onPress={handleDetectLocation}
            disabled={locating}
          >
            {locating ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Text style={styles.geoButtonText}>Определить местоположение</Text>
            )}
          </TouchableOpacity>
          <TextInput
            style={[styles.input, errors.street && styles.inputError]}
            placeholder="ул. Ленина"
            placeholderTextColor={COLORS.textLight}
            value={form.street}
            onChangeText={(v) => {
              if (v.length > 80) return;
              updateField('street', v);
            }}
          />
          {errors.street && <Text style={styles.errorText}>⚠ {errors.street}</Text>}

          <Text style={styles.sectionLabel}>
            Дом <Text style={styles.charCount}>{form.house.length}/15</Text>
          </Text>
          <TextInput
            style={[styles.input, errors.house && styles.inputError]}
            placeholder="15"
            placeholderTextColor={COLORS.textLight}
            value={form.house}
            onChangeText={(v) => {
              if (v.length > 15) return;
              updateField('house', v);
            }}
          />
          {errors.house && <Text style={styles.errorText}>⚠ {errors.house}</Text>}

          <Text style={styles.sectionLabel}>
            Подъезд (необязательно) <Text style={styles.charCount}>{form.entrance.length}/10</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="2"
            placeholderTextColor={COLORS.textLight}
            value={form.entrance}
            onChangeText={(v) => {
              if (v.length > 10) return;
              updateField('entrance', v);
            }}
          />

          <Text style={styles.sectionLabel}>
            Этаж (необязательно) <Text style={styles.charCount}>{form.floor.length}/10</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="5"
            placeholderTextColor={COLORS.textLight}
            value={form.floor}
            onChangeText={(v) => {
              if (v.length > 10) return;
              updateField('floor', v);
            }}
          />

          <Text style={styles.sectionLabel}>
            Квартира (необязательно) <Text style={styles.charCount}>{form.apartment.length}/10</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="12"
            placeholderTextColor={COLORS.textLight}
            value={form.apartment}
            onChangeText={(v) => {
              if (v.length > 10) return;
              updateField('apartment', v);
            }}
          />

          <Text style={styles.sectionLabel}>
            Телефон <Text style={styles.charCount}>{form.phone.length}/12</Text>
          </Text>
          <TextInput
            style={[styles.input, errors.phone && styles.inputError]}
            placeholder="+79991234567"
            placeholderTextColor={COLORS.textLight}
            value={form.phone}
            onChangeText={handlePhoneChange}
            keyboardType="phone-pad"
          />
          {errors.phone && <Text style={styles.errorText}>⚠ {errors.phone}</Text>}

          <Text style={styles.sectionLabel}>Время доставки</Text>
          <Text style={styles.sectionLabel}>День доставки</Text>
          <View style={styles.dayRow}>
            {['Сегодня', 'Завтра'].map((day) => (
              <TouchableOpacity
                key={day}
                style={[styles.dayButton, deliveryDay === day && styles.dayButtonActive]}
                onPress={() => {
                  setDeliveryDay(day);
                  if (errors.deliveryDay) setErrors((prev) => ({ ...prev, deliveryDay: null }));
                }}
              >
                <Text style={[styles.dayButtonText, deliveryDay === day && styles.dayButtonTextActive]}>{day}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.deliveryDay && <Text style={styles.errorText}>⚠ {errors.deliveryDay}</Text>}

          <Text style={styles.sectionLabel}>Время доставки</Text>
          <View style={styles.slotsGrid}>
            {TIME_SLOTS.map((slot) => (
              <TouchableOpacity
                key={slot}
                style={[styles.slot, selectedSlot === slot && styles.slotActive]}
                onPress={() => {
                  setSelectedSlot(slot);
                  if (errors.slot) setErrors((prev) => ({ ...prev, slot: null }));
                }}
              >
                <Text style={[styles.slotText, selectedSlot === slot && styles.slotTextActive]}>
                  {slot}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.slot && <Text style={styles.errorText}>⚠ {errors.slot}</Text>}

          <Text style={styles.sectionLabel}>
            Комментарий (необязательно) <Text style={styles.charCount}>{form.comment.length}/200</Text>
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
          />

          <TouchableOpacity
            style={[styles.orderButton, loading && styles.buttonDisabled]}
            onPress={handleCheckout}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.orderButtonText}>Оформить заказ — {finalTotal} ₽</Text>
            )}
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
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.lg },
  emptyEmoji: { fontSize: 48, marginBottom: SPACING.sm },
  emptyTitle: { fontSize: FONTS.subheading, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.xs },
  emptySubtitle: { fontSize: FONTS.body - 1, color: COLORS.textLight, textAlign: 'center', marginBottom: SPACING.lg },
  catalogButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    borderRadius: 12,
  },
  catalogButtonText: { color: COLORS.white, fontSize: FONTS.body - 1, fontWeight: '700' },
  title: {
    fontSize: FONTS.heading - 6,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  emoji: { fontSize: 32, marginRight: SPACING.sm },
  info: { flex: 1 },
  brand: { fontSize: FONTS.body, fontWeight: '700', color: COLORS.primary },
  name: { fontSize: FONTS.caption, color: COLORS.text },
  price: { fontSize: FONTS.caption, color: COLORS.textLight },
  controlsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  quantityControls: { flexDirection: 'row', alignItems: 'center' },
  qtyButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyButtonText: { color: COLORS.white, fontSize: 20, fontWeight: '700' },
  quantity: { marginHorizontal: SPACING.md, fontSize: FONTS.body, fontWeight: '700', color: COLORS.text },
  removeText: { color: '#FF3B30', fontSize: FONTS.caption, fontWeight: '700' },
  itemTotal: { marginTop: SPACING.sm, color: COLORS.text, fontWeight: '700', fontSize: FONTS.body - 1 },
  summary: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: SPACING.md,
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  summaryText: { fontSize: FONTS.subheading - 2, color: COLORS.primary, fontWeight: '700', textAlign: 'center' },
  summarySubtext: { marginTop: 4, fontSize: FONTS.caption, color: COLORS.textLight, textAlign: 'center' },
  sectionLabel: {
    fontSize: FONTS.body - 1,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
    marginTop: SPACING.sm,
  },
  charCount: { fontSize: FONTS.caption, color: COLORS.textLight, fontWeight: '400' },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    fontSize: FONTS.body - 1,
    color: COLORS.text,
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
    marginBottom: 4,
  },
  inputError: { borderColor: '#FF3B30' },
  geoButton: {
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    marginBottom: SPACING.sm,
  },
  geoButtonText: { color: COLORS.primary, fontSize: FONTS.caption, fontWeight: '700' },
  textArea: { height: 80, textAlignVertical: 'top' },
  errorText: { fontSize: FONTS.caption, color: '#FF3B30', marginBottom: SPACING.sm },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: 4 },
  slot: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
    backgroundColor: COLORS.white,
  },
  slotActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  slotText: { fontSize: FONTS.caption, color: COLORS.text, fontWeight: '600' },
  slotTextActive: { color: COLORS.white },
  dayRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: 4 },
  dayButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
    backgroundColor: COLORS.white,
    alignItems: 'center',
  },
  dayButtonActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  dayButtonText: { fontSize: FONTS.body - 1, color: COLORS.text, fontWeight: '600' },
  dayButtonTextActive: { color: COLORS.white },
  orderButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  buttonDisabled: { opacity: 0.6 },
  orderButtonText: { color: COLORS.white, fontSize: FONTS.body, fontWeight: '700' },
});
