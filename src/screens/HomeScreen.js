import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { COLORS, FONTS, SPACING } from '../constants/theme';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Text style={styles.greeting}>Добро пожаловать 👋</Text>
          <Text style={styles.subtitle}>Акватория — чистая вода для вас</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>🕐 График работы</Text>
          <View style={styles.scheduleRow}>
            <Text style={styles.scheduleDay}>Пн — Пт</Text>
            <Text style={styles.scheduleTime}>08:00 — 20:00</Text>
          </View>
          <View style={styles.scheduleRow}>
            <Text style={styles.scheduleDay}>Суббота</Text>
            <Text style={styles.scheduleTime}>09:00 — 18:00</Text>
          </View>
          <View style={styles.scheduleRow}>
            <Text style={styles.scheduleDay}>Воскресенье</Text>
            <Text style={styles.scheduleTime}>10:00 — 16:00</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>💧 О нашей воде</Text>
          <Text style={styles.cardText}>
            Вся вода проходит многоступенчатую систему очистки и соответствует
            стандартам ГОСТ. Мы сотрудничаем только с проверенными производителями.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>✅ Преимущества</Text>
          <Text style={styles.benefitItem}>🚚 Доставка от 2 часов</Text>
          <Text style={styles.benefitItem}>📦 Бесплатная доставка от 2 бутылей</Text>
          <Text style={styles.benefitItem}>🔄 Обмен пустых баллонов</Text>
          <Text style={styles.benefitItem}>💳 Оплата картой или наличными</Text>
        </View>

        <View style={[styles.card, styles.contactCard]}>
          <Text style={styles.cardTitle}>📞 Контакты</Text>
          <Text style={styles.contactText}>+7 (800) 123-45-67</Text>
          <Text style={styles.contactSubtext}>Звонок бесплатный</Text>
        </View>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🏢 О нас</Text>
          <Text style={styles.cardText}>
            Акватория — сервис доставки питьевой воды, работающий с 2026 года.
            За это время мы доставили более 500 000 бутылей воды жителям города.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>🎯 Наша миссия</Text>
          <Text style={styles.cardText}>
            Обеспечить каждый дом и офис качественной питьевой водой по доступной цене.
            Мы тщательно отбираем поставщиков и гарантируем качество каждой бутыли.
          </Text>
        </View>

        <View style={[styles.card, { marginBottom: SPACING.xl }]}>
          <Text style={styles.cardTitle}>📊 Цифры</Text>
          <View style={styles.scheduleRow}>
            <Text style={styles.scheduleDay}>Клиентов</Text>
            <Text style={styles.scheduleTime}>12 000+</Text>
          </View>
          <View style={styles.scheduleRow}>
            <Text style={styles.scheduleDay}>Доставок в день</Text>
            <Text style={styles.scheduleTime}>300+</Text>
          </View>
          <View style={styles.scheduleRow}>
            <Text style={styles.scheduleDay}>Лет на рынке</Text>
            <Text style={styles.scheduleTime}>10</Text>
          </View>
          <View style={styles.scheduleRow}>
            <Text style={styles.scheduleDay}>Марок воды</Text>
            <Text style={styles.scheduleTime}>4</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, paddingHorizontal: SPACING.lg },
  header: { marginTop: SPACING.lg, marginBottom: SPACING.lg },
  greeting: { fontSize: FONTS.heading - 4, fontWeight: 'bold', color: COLORS.primary },
  subtitle: { fontSize: FONTS.body, color: COLORS.textLight, marginTop: 4 },
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
  cardTitle: { fontSize: FONTS.subheading - 2, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm },
  cardText: { fontSize: FONTS.body - 1, color: COLORS.textLight, lineHeight: 22 },
  scheduleRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  scheduleDay: { fontSize: FONTS.body - 1, color: COLORS.text },
  scheduleTime: { fontSize: FONTS.body - 1, color: COLORS.primary, fontWeight: '600' },
  benefitItem: { fontSize: FONTS.body - 1, color: COLORS.text, paddingVertical: 3 },
  contactCard: { alignItems: 'center', marginBottom: SPACING.xl },
  contactText: { fontSize: FONTS.heading - 8, fontWeight: 'bold', color: COLORS.primary },
  contactSubtext: { fontSize: FONTS.caption, color: COLORS.textLight, marginTop: 2 },
});