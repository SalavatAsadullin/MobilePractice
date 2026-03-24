import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image } from 'react-native';
import { COLORS, FONTS, SPACING } from '../constants/theme';

export default function WelcomeScreen( {navigation} ) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        <View style={styles.logoSection}>
          <Image
            source={require('../../assets/logo.jpg')}
            style={styles.logo}
            resizeMode="contain"
            />
          <Text style={styles.appName}>Акватория</Text>
          <Text style={styles.tagline}>Чистая вода — прямо к вашей двери</Text>
        </View>

        <View style={styles.featuresSection}>
          <FeatureItem
            emoji="🛒"
            title="Удобный заказ"
            description="Выберите объём и марку воды в пару касаний"
          />
          <FeatureItem
            emoji="🚚"
            title="Быстрая доставка"
            description="Доставим в удобное для вас время"
          />
          <FeatureItem
            emoji="📦"
            title="Отслеживание заказа"
            description="Следите за статусом вашего заказа онлайн"
          />
        </View>

        <View style={styles.buttonSection}>
          <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('Register')}>
            <Text style={styles.primaryButtonText}>Зарегистрироваться</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.secondaryButtonText}>Уже есть аккаунт? Войти</Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

function FeatureItem({ emoji, title, description }) {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureEmoji}>{emoji}</Text>
      <View style={styles.featureText}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    justifyContent: 'space-between',
    paddingVertical: SPACING.xl,
  },

  logoSection: {
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  logo: {
  width: 120,
  height: 120,
  marginBottom: SPACING.md,
  },
  appName: {
    fontSize: FONTS.heading,
    fontWeight: 'bold',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: FONTS.body,
    color: COLORS.textLight,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },

  featuresSection: {
    gap: SPACING.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  featureEmoji: {
    fontSize: 28,
    marginRight: SPACING.md,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: FONTS.subheading - 2,
    fontWeight: '600',
    color: COLORS.text,
  },
  featureDescription: {
    fontSize: FONTS.caption,
    color: COLORS.textLight,
    marginTop: 2,
  },

  buttonSection: {
    gap: SPACING.sm,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: FONTS.body,
    fontWeight: '700',
  },
  secondaryButton: {
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontSize: FONTS.body,
  },
});