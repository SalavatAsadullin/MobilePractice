import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import { supabase } from '../services/supabase';
import { useAppContext } from '../context/AppContext';

const STATUS_COLORS = {
  'В процессе': '#FF9500',
  Выполнен: '#4CAF50',
  Отменён: '#FF3B30',
};

export default function AdminOrdersScreen({ navigation }) {
  const { user } = useAppContext();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'В процессе')
        .order('created_at', { ascending: true });
      if (error) return;
      const dayPriority = { Сегодня: 0, Завтра: 1 };
      const parseSlotStart = (slot) => {
        if (!slot || typeof slot !== 'string') return 9999;
        const [start] = slot.split('-');
        if (!start) return 9999;
        const [h, m] = start.split(':').map((n) => Number(n));
        if (!Number.isFinite(h) || !Number.isFinite(m)) return 9999;
        return h * 60 + m;
      };
      const sorted = (data || []).slice().sort((a, b) => {
        const dayA = dayPriority[a.delivery_day] ?? 99;
        const dayB = dayPriority[b.delivery_day] ?? 99;
        if (dayA !== dayB) return dayA - dayB;

        const slotA = parseSlotStart(a.time_slot);
        const slotB = parseSlotStart(b.time_slot);
        if (slotA !== slotB) return slotA - slotB;

        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
      setOrders(sorted);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (user?.isAdmin) {
        loadOrders();
      } else {
        setLoading(false);
      }
    }, [user?.isAdmin])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
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
          <Text style={styles.emptyTitle}>Доступ ограничен</Text>
          <Text style={styles.emptySubtitle}>Эта вкладка доступна только администраторам</Text>
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        <Text style={styles.title}>Все заказы</Text>
        <Text style={styles.subtitle}>Нажмите на заказ, чтобы открыть полную информацию</Text>

        {orders.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>Активных заказов нет</Text>
          </View>
        ) : (
          orders.map((order) => {
            const statusColor = STATUS_COLORS[order.status] || COLORS.textLight;
            const displayTotal = order.total_price ?? order.price * order.quantity;
            return (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                onPress={() => navigation.navigate('AdminOrderDetails', { orderId: order.id })}
              >
                <View style={styles.headerRow}>
                  <View style={styles.headerLeft}>
                    <Text style={styles.orderId}>№{order.id}</Text>
                    <Text style={styles.deliveryBadge}>
                      {order.delivery_day || 'Сегодня'} • {order.time_slot || '—'}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                    <Text style={[styles.statusText, { color: statusColor }]}>
                      {order.status || 'В процессе'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.orderProduct}>{order.brand} {order.volume} × {order.quantity}</Text>
                <Text style={styles.orderMeta}>Обмен: {order.exchange_qty ?? 0}</Text>
                <Text style={styles.orderAddress}>📍 {order.address}</Text>
                {order.comment ? (
                  <Text style={styles.orderComment}>💬 {order.comment}</Text>
                ) : null}
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: SPACING.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, paddingHorizontal: SPACING.lg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.lg },
  title: { marginTop: SPACING.md, fontSize: FONTS.heading - 6, fontWeight: '700', color: COLORS.primary },
  subtitle: { marginTop: 4, marginBottom: SPACING.md, fontSize: FONTS.caption, color: COLORS.textLight },
  emptyBox: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  emptyTitle: { fontSize: FONTS.body, fontWeight: '700', color: COLORS.text },
  emptySubtitle: { marginTop: 6, fontSize: FONTS.caption, color: COLORS.textLight, textAlign: 'center' },
  orderCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  headerLeft: { flex: 1, marginRight: SPACING.sm },
  orderId: { fontSize: FONTS.body - 1, fontWeight: '700', color: COLORS.text },
  deliveryBadge: { marginTop: 2, fontSize: FONTS.caption, fontWeight: '700', color: COLORS.primary },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  statusText: { fontSize: FONTS.caption, fontWeight: '600' },
  orderProduct: { fontSize: FONTS.body - 1, color: COLORS.text, marginBottom: 2, fontWeight: '600' },
  orderMeta: { fontSize: FONTS.caption, color: COLORS.textLight, marginBottom: 4 },
  orderAddress: { fontSize: FONTS.body - 1, color: COLORS.text, marginBottom: 6, lineHeight: 20 },
  orderComment: {
    fontSize: FONTS.body - 1,
    color: '#C62828',
    lineHeight: 20,
    backgroundColor: '#FFF1F1',
    borderWidth: 1,
    borderColor: '#F2B8B5',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
});
