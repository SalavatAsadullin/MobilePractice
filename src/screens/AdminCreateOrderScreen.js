import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import { supabase } from '../services/supabase';
import { useAppContext } from '../context/AppContext';

const TIME_SLOTS = ['09:00-11:00', '11:00-13:00', '13:00-15:00', '15:00-17:00', '17:00-19:00'];

export default function AdminCreateOrderScreen() {
  const { user } = useAppContext();
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [exchangeQty, setExchangeQty] = useState('');
  const [deliveryDay, setDeliveryDay] = useState('Сегодня');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [form, setForm] = useState({
    street: '',
    house: '',
    entrance: '',
    floor: '',
    apartment: '',
    phone: '',
    comment: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const { data, error } = await supabase.from('products').select('*').order('id', { ascending: true });
        if (!error) setProducts(data || []);
      } finally {
        setProductsLoading(false);
      }
    };
    if (user?.isAdmin) loadProducts();
    else setProductsLoading(false);
  }, [user?.isAdmin]);

  const selectedProduct = products.find((p) => p.id === selectedProductId) || null;
  const exchangeCount = Number(exchangeQty || 0);
  const discountTotal = exchangeCount * 200;
  const total = selectedProduct ? Math.max(0, selectedProduct.price * quantity - discountTotal) : 0;

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const next = {};
    if (!selectedProduct) next.product = 'Выберите бутыль';
    if (!form.street.trim()) next.street = 'Введите улицу';
    else if (form.street.trim().length < 3) next.street = 'Улица слишком короткая';
    if (!form.house.trim()) next.house = 'Введите номер дома';
    if (!form.phone.trim()) next.phone = 'Введите телефон';
    else if (!/^\+7\d{10}$/.test(form.phone)) next.phone = 'Формат: +79991234567';
    if (!selectedSlot) next.slot = 'Выберите время доставки';
    if (!deliveryDay) next.deliveryDay = 'Выберите день доставки';
    if (exchangeQty === '') next.exchangeQty = 'Укажите бутыли на обмен';
    else if (!/^\d+$/.test(exchangeQty)) next.exchangeQty = 'Только целое число';
    else if (Number(exchangeQty) > quantity) next.exchangeQty = 'Не может быть больше количества';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submitOrder = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const authUser = authData?.user;
      if (!authUser) {
        Alert.alert('Ошибка', 'Сессия истекла, войдите снова');
        return;
      }

      const composedAddress = [
        form.street.trim(),
        form.house.trim(),
        form.entrance.trim() ? `подъезд ${form.entrance.trim()}` : '',
        form.floor.trim() ? `этаж ${form.floor.trim()}` : '',
        form.apartment.trim() ? `кв. ${form.apartment.trim()}` : '',
      ]
        .filter(Boolean)
        .join(', ');

      const { error } = await supabase.from('orders').insert([{
        user_id: authUser.id,
        brand: selectedProduct.brand,
        volume: selectedProduct.volume,
        price: selectedProduct.price,
        unit_price: selectedProduct.price,
        address: composedAddress,
        phone: form.phone,
        quantity,
        exchange_qty: Number(exchangeQty),
        delivery_day: deliveryDay,
        time_slot: selectedSlot,
        comment: form.comment.trim(),
        status: 'В процессе',
      }]);

      if (error) {
        Alert.alert('Ошибка', 'Не удалось создать заказ');
        return;
      }

      Alert.alert('Готово', `Заказ создан на сумму ${total} ₽\nДень: ${deliveryDay}`);
      setSelectedProductId(null);
      setQuantity(1);
      setExchangeQty('');
      setSelectedSlot(null);
      setForm({
        street: '',
        house: '',
        entrance: '',
        floor: '',
        apartment: '',
        phone: '',
        comment: '',
      });
      setErrors({});
    } catch (_) {
      Alert.alert('Ошибка', 'Нет соединения с сервером');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePhoneChange = (value) => {
    let cleaned = value.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('8')) cleaned = '+7' + cleaned.slice(1);
    if (cleaned.startsWith('7') && !cleaned.startsWith('+7')) cleaned = '+' + cleaned;
    if (cleaned.length > 12) return;
    updateField('phone', cleaned);
  };

  const changeQuantity = (delta) => {
    const next = Math.max(1, quantity + delta);
    setQuantity(next);
    if (exchangeQty !== '' && Number(exchangeQty) > next) {
      setExchangeQty(String(next));
      if (errors.exchangeQty) setErrors((prev) => ({ ...prev, exchangeQty: null }));
    }
  };

  if (!user?.isAdmin) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Доступ только для администраторов</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (productsLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Оформление заказа</Text>
          <Text style={styles.subtitle}>Выберите бутыль и заполните данные клиента</Text>

          <Text style={styles.sectionLabel}>Выбор бутыли</Text>
          {products.map((item) => {
            const selected = item.id === selectedProductId;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.productCard, selected && styles.productCardSelected]}
                onPress={() => {
                  setSelectedProductId(item.id);
                  if (errors.product) setErrors((prev) => ({ ...prev, product: null }));
                }}
              >
                <Text style={styles.productEmoji}>{item.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.productBrand}>{item.brand}</Text>
                  <Text style={styles.productName}>{item.name}</Text>
                  <Text style={styles.productVolume}>{item.volume}</Text>
                </View>
                <Text style={styles.productPrice}>{item.price} ₽</Text>
              </TouchableOpacity>
            );
          })}
          {errors.product && <Text style={styles.errorText}>⚠ {errors.product}</Text>}

          <Text style={styles.sectionLabel}>Количество</Text>
          <View style={styles.qtyRow}>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => changeQuantity(-1)}>
              <Text style={styles.qtyBtnText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.qtyValue}>{quantity}</Text>
            <TouchableOpacity style={styles.qtyBtn} onPress={() => changeQuantity(1)}>
              <Text style={styles.qtyBtnText}>+</Text>
            </TouchableOpacity>
            <Text style={styles.totalText}>Сумма: {total} ₽</Text>
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
              if (Number(v) > quantity) return;
              setExchangeQty(v);
              if (errors.exchangeQty) setErrors((prev) => ({ ...prev, exchangeQty: null }));
            }}
            keyboardType="number-pad"
          />
          {errors.exchangeQty && <Text style={styles.errorText}>⚠ {errors.exchangeQty}</Text>}
          <Text style={styles.discountHint}>
            Скидка: {discountTotal} ₽ (200 ₽ × {exchangeCount})
          </Text>

          <Text style={styles.sectionLabel}>Улица</Text>
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

          <Text style={styles.sectionLabel}>Дом</Text>
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

          <Text style={styles.sectionLabel}>Подъезд (необязательно)</Text>
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

          <Text style={styles.sectionLabel}>Этаж (необязательно)</Text>
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

          <Text style={styles.sectionLabel}>Квартира (необязательно)</Text>
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

          <Text style={styles.sectionLabel}>Телефон</Text>
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
                <Text style={[styles.slotText, selectedSlot === slot && styles.slotTextActive]}>{slot}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.slot && <Text style={styles.errorText}>⚠ {errors.slot}</Text>}

          <Text style={styles.sectionLabel}>Комментарий (необязательно)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Комментарий к заказу"
            placeholderTextColor={COLORS.textLight}
            value={form.comment}
            onChangeText={(v) => {
              if (v.length > 250) return;
              updateField('comment', v);
            }}
            multiline
            numberOfLines={4}
          />

          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
            onPress={submitOrder}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.submitBtnText}>Создать заказ</Text>
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
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: FONTS.body, color: COLORS.text, textAlign: 'center' },
  title: { marginTop: SPACING.md, fontSize: FONTS.heading - 6, fontWeight: '700', color: COLORS.primary },
  subtitle: { marginTop: 4, marginBottom: SPACING.md, fontSize: FONTS.caption, color: COLORS.textLight },
  sectionLabel: {
    marginTop: SPACING.sm,
    marginBottom: 8,
    fontSize: FONTS.body - 1,
    fontWeight: '600',
    color: COLORS.text,
  },
  productCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
    padding: SPACING.sm + 2,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  productCardSelected: { borderColor: COLORS.primary },
  productEmoji: { fontSize: 28, marginRight: SPACING.sm },
  productBrand: { fontSize: FONTS.body - 1, fontWeight: '700', color: COLORS.primary },
  productName: { fontSize: FONTS.caption, color: COLORS.text },
  productVolume: { fontSize: FONTS.caption, color: COLORS.textLight },
  productPrice: { fontSize: FONTS.body - 1, fontWeight: '700', color: COLORS.text },
  qtyRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: { color: COLORS.white, fontSize: 20, fontWeight: '700' },
  qtyValue: { marginHorizontal: SPACING.md, fontSize: FONTS.body, fontWeight: '700', color: COLORS.text },
  totalText: { marginLeft: SPACING.md, fontSize: FONTS.body - 1, color: COLORS.primary, fontWeight: '700' },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    fontSize: FONTS.body - 1,
    color: COLORS.text,
  },
  inputError: { borderColor: '#FF3B30' },
  errorText: { marginTop: 4, fontSize: FONTS.caption, color: '#FF3B30' },
  discountHint: { marginTop: 4, fontSize: FONTS.caption, color: COLORS.textLight },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
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
  textArea: { height: 90, textAlignVertical: 'top' },
  submitBtn: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: COLORS.white, fontSize: FONTS.body, fontWeight: '700' },
});
