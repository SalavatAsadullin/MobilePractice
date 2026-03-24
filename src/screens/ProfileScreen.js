import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, FONTS, SPACING } from '../constants/theme';
import { supabase } from '../services/supabase';

// Статус заказа → цвет
const STATUS_COLORS = {
  'В процессе': '#FF9500',
  'Выполнен':   '#4CAF50',
  'Отменён':    '#FF3B30',
};

export default function ProfileScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Перезагружаем данные каждый раз при фокусе экрана
  // (например, после оформления нового заказа)
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return; // App.js сам перенаправит на Login если сессия пропала

      // Загружаем профиль (имя, телефон)
      const { data: profileData } = await supabase
        .from('profiles')
        .select('name, phone')
        .eq('id', user.id)
        .single();

      setProfile({ ...profileData, email: user.email });

      // Загружаем заказы этого пользователя
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setOrders(ordersData || []);
    } catch (e) {
      // Ошибка сети — оставляем старые данные
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleLogout = () => {
    Alert.alert(
      'Выход',
      'Вы уверены, что хотите выйти?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Выйти',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            navigation.replace('Welcome');
          },
        },
      ]
    );
  };

  // Статистика заказов
  const totalOrders    = orders.length;
  const doneOrders     = orders.filter(o => o.status === 'Выполнен').length;
  const cancelledOrders = orders.filter(o => o.status === 'Отменён').length;

  // Первая буква имени для аватара
  const avatarLetter = profile?.name?.[0]?.toUpperCase() || '?';

  // Форматируем дату из ISO строки
  const formatDate = (isoStr) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  };

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
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
      >
        {/* Шапка профиля */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{avatarLetter}</Text>
          </View>
          <Text style={styles.name}>{profile?.name || '—'}</Text>
          <Text style={styles.email}>{profile?.email || '—'}</Text>
          {profile?.phone ? <Text style={styles.phone}>{profile.phone}</Text> : null}
        </View>

        {/* Статистика */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{totalOrders}</Text>
            <Text style={styles.statLabel}>Заказов</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{doneOrders}</Text>
            <Text style={styles.statLabel}>Выполнено</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{cancelledOrders}</Text>
            <Text style={styles.statLabel}>Отменено</Text>
          </View>
        </View>

        {/* История заказов */}
        <Text style={styles.sectionTitle}>История заказов</Text>

        {orders.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>У вас пока нет заказов</Text>
            <Text style={styles.emptySubtext}>Перейдите в каталог и оформите первый!</Text>
          </View>
        ) : (
          orders.map((order) => {
            const statusColor = STATUS_COLORS[order.status] || COLORS.textLight;
            return (
              <View key={order.id} style={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <Text style={styles.orderId}>№{order.id}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                    <Text style={[styles.statusText, { color: statusColor }]}>
                      {order.status || 'В процессе'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.orderProduct}>
                  {order.brand} {order.volume} × {order.quantity}
                </Text>
                <Text style={styles.orderAddress}>📍 {order.address}</Text>
                <View style={styles.orderFooter}>
                  <Text style={styles.orderDate}>{formatDate(order.created_at)}</Text>
                  <Text style={styles.orderPrice}>{order.price * order.quantity} ₽</Text>
                </View>
              </View>
            );
          })
        )}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Выйти из аккаунта</Text>
        </TouchableOpacity>

        <View style={{ height: SPACING.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, paddingHorizontal: SPACING.lg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  profileHeader: { alignItems: 'center', marginTop: SPACING.lg, marginBottom: SPACING.lg },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  avatarText: { fontSize: 36, color: COLORS.white, fontWeight: 'bold' },
  name: { fontSize: FONTS.subheading, fontWeight: 'bold', color: COLORS.text },
  email: { fontSize: FONTS.caption, color: COLORS.textLight, marginTop: 2 },
  phone: { fontSize: FONTS.caption, color: COLORS.textLight, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  statCard: {
    flex: 1, backgroundColor: COLORS.white, borderRadius: 12,
    padding: SPACING.md, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  statNumber: { fontSize: FONTS.subheading - 2, fontWeight: 'bold', color: COLORS.primary },
  statLabel: { fontSize: FONTS.caption, color: COLORS.textLight, marginTop: 2, textAlign: 'center' },
  sectionTitle: { fontSize: FONTS.subheading - 2, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm },
  emptyBox: {
    backgroundColor: COLORS.white, borderRadius: 14,
    padding: SPACING.lg, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    marginBottom: SPACING.md,
  },
  emptyText: { fontSize: FONTS.body, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  emptySubtext: { fontSize: FONTS.caption, color: COLORS.textLight, textAlign: 'center' },
  orderCard: {
    backgroundColor: COLORS.white, borderRadius: 12, padding: SPACING.md,
    marginBottom: SPACING.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  orderId: { fontSize: FONTS.body - 1, fontWeight: '700', color: COLORS.text },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  statusText: { fontSize: FONTS.caption, fontWeight: '600' },
  orderProduct: { fontSize: FONTS.body - 1, color: COLORS.text, marginBottom: 2 },
  orderAddress: { fontSize: FONTS.caption, color: COLORS.textLight, marginBottom: 4 },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 },
  orderDate: { fontSize: FONTS.caption, color: COLORS.textLight },
  orderPrice: { fontSize: FONTS.caption, fontWeight: '700', color: COLORS.primary },
  logoutButton: {
    marginTop: SPACING.lg, paddingVertical: SPACING.md,
    borderRadius: 14, borderWidth: 1.5, borderColor: '#FF3B30', alignItems: 'center',
  },
  logoutText: { color: '#FF3B30', fontSize: FONTS.body, fontWeight: '600' },
});