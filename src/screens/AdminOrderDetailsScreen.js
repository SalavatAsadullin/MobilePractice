import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import { supabase } from '../services/supabase';
import { useAppContext } from '../context/AppContext';

const STATUS_COLORS = {
  'В процессе': '#FF9500',
  Выполнен: '#4CAF50',
  Отменён: '#FF3B30',
};

export default function AdminOrderDetailsScreen({ route, navigation }) {
  const { orderId } = route.params || {};
  const { user } = useAppContext();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadOrder = async () => {
    try {
      if (!orderId) return;
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();
      if (error) return;
      setOrder(data);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (user?.isAdmin) {
        loadOrder();
      } else {
        setLoading(false);
      }
    }, [orderId, user?.isAdmin])
  );

  const updateStatus = async (status) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);
      if (error) {
        Alert.alert('Ошибка', 'Не удалось изменить статус');
        return;
      }
      setOrder((prev) => (prev ? { ...prev, status } : prev));
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    return d.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!user?.isAdmin) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.noAccessText}>Доступ только для администраторов</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.noAccessText}>Заказ не найден</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusColor = STATUS_COLORS[order.status] || COLORS.textLight;
  const total = order.total_price ?? order.price * order.quantity;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Назад к списку</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Заказ №{order.id}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {order.status || 'В процессе'}
              </Text>
            </View>
          </View>

          <Text style={styles.field}><Text style={styles.label}>Товар:</Text> {order.brand} {order.volume}</Text>
          <Text style={styles.field}><Text style={styles.label}>Количество:</Text> {order.quantity}</Text>
          <Text style={styles.field}><Text style={styles.label}>Бутыли на обмен:</Text> {order.exchange_qty ?? 0}</Text>
          <Text style={styles.field}><Text style={styles.label}>Сумма:</Text> {total} ₽</Text>
          <Text style={styles.field}><Text style={styles.label}>Адрес:</Text> {order.address}</Text>
          <Text style={styles.field}><Text style={styles.label}>Телефон:</Text> {order.phone}</Text>
          <Text style={styles.field}><Text style={styles.label}>День доставки:</Text> {order.delivery_day || 'Сегодня'}</Text>
          <Text style={styles.field}><Text style={styles.label}>Окно доставки:</Text> {order.time_slot || '—'}</Text>

          <Text style={[styles.label, { marginTop: SPACING.sm }]}>Комментарий:</Text>
          <View style={styles.commentBox}>
            <Text style={styles.commentText}>{order.comment || 'Без комментария'}</Text>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.doneBtn, saving && styles.disabledBtn]}
              onPress={() => updateStatus('Выполнен')}
              disabled={saving}
            >
              <Text style={styles.doneBtnText}>Выполнить</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.cancelBtn, saving && styles.disabledBtn]}
              onPress={() => updateStatus('Отменён')}
              disabled={saving}
            >
              <Text style={styles.cancelBtnText}>Отменить</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: SPACING.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, paddingHorizontal: SPACING.lg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.lg },
  noAccessText: { fontSize: FONTS.body, color: COLORS.text, textAlign: 'center' },
  backButton: { marginTop: SPACING.md, marginBottom: SPACING.sm },
  backText: { color: COLORS.primary, fontSize: FONTS.body - 1, fontWeight: '600' },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  title: { fontSize: FONTS.subheading, fontWeight: '700', color: COLORS.text },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  statusText: { fontSize: FONTS.caption, fontWeight: '700' },
  label: { fontWeight: '700', color: COLORS.text },
  field: { fontSize: FONTS.body - 1, color: COLORS.text, marginBottom: 4 },
  commentBox: {
    marginTop: 6,
    borderRadius: 10,
    backgroundColor: '#F7F7FA',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    padding: SPACING.sm,
  },
  commentText: { color: COLORS.text, fontSize: FONTS.body - 1, lineHeight: 20 },
  actionsRow: { marginTop: SPACING.md, flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' },
  actionBtn: {
    borderRadius: 10,
    borderWidth: 1.5,
    paddingVertical: 8,
    paddingHorizontal: SPACING.md,
    minWidth: 120,
    alignItems: 'center',
  },
  doneBtn: { borderColor: '#4CAF50' },
  doneBtnText: { color: '#4CAF50', fontSize: FONTS.caption, fontWeight: '700' },
  cancelBtn: { borderColor: '#FF3B30' },
  cancelBtnText: { color: '#FF3B30', fontSize: FONTS.caption, fontWeight: '700' },
  disabledBtn: { opacity: 0.6 },
});
