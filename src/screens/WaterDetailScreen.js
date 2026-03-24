import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING } from '../constants/theme';

export default function WaterDetailScreen({ route, navigation }) {
  const { product } = route.params;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Назад</Text>
        </TouchableOpacity>

        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>{product.emoji}</Text>
          <Text style={styles.heroBrand}>{product.brand}</Text>
          <Text style={styles.heroName}>{product.name}</Text>
          <Text style={styles.heroVolume}>{product.volume}</Text>
          <Text style={styles.heroPrice}>{product.price} ₽</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📖 О продукте</Text>
          <Text style={styles.cardText}>{product.about}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📍 Происхождение</Text>
          <InfoRow label="Страна" value={product.country} />
          <InfoRow label="Регион" value={product.region} />
          <InfoRow label="Источник" value={product.source} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔬 Характеристики</Text>
          <InfoRow label="Минерализация" value={product.mineralization} />
          <InfoRow label="pH" value={product.ph} />
          <InfoRow label="Жёсткость" value={product.hardness} />
          <InfoRow label="Срок хранения" value={product.shelfLife} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>⚗️ Состав</Text>
          <Text style={styles.cardText}>{product.composition}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>✅ Сертификация</Text>
          <Text style={styles.cardText}>{product.certificate}</Text>
        </View>

        <TouchableOpacity
          style={styles.orderButton}
          onPress={() => navigation.navigate('Order', { product })}
        >
          <Text style={styles.orderButtonText}>Заказать — {product.price} ₽</Text>
        </TouchableOpacity>

        <View style={{ height: SPACING.xl }} />

      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, paddingHorizontal: SPACING.lg },
  backButton: { marginTop: SPACING.md },
  backText: { fontSize: FONTS.body, color: COLORS.primary },
  hero: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  heroEmoji: { fontSize: 72, marginBottom: SPACING.sm },
  heroBrand: { fontSize: FONTS.heading - 4, fontWeight: 'bold', color: COLORS.primary },
  heroName: { fontSize: FONTS.body, color: COLORS.textLight, marginTop: 4, textAlign: 'center' },
  heroVolume: { fontSize: FONTS.body, color: COLORS.textLight, marginTop: 2 },
  heroPrice: { fontSize: FONTS.heading - 4, fontWeight: 'bold', color: COLORS.text, marginTop: SPACING.sm },
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
  cardTitle: {
    fontSize: FONTS.body,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  cardText: {
    fontSize: FONTS.body - 1,
    color: COLORS.textLight,
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: { fontSize: FONTS.body - 1, color: COLORS.textLight },
  infoValue: { fontSize: FONTS.body - 1, color: COLORS.text, fontWeight: '600', flex: 1, textAlign: 'right' },
  orderButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  orderButtonText: { color: COLORS.white, fontSize: FONTS.body, fontWeight: '700' },
});