import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';

import WelcomeScreen from './src/screens/WelcomeScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import CatalogScreen from './src/screens/CatalogScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import OrderScreen from './src/screens/OrderScreen';
import { COLORS } from './src/constants/theme';
import LoginScreen from './src/screens/LoginScreen';
import WaterDetailScreen from './src/screens/WaterDetailScreen';
import { supabase } from './src/services/supabase';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarStyle: { backgroundColor: COLORS.white, borderTopColor: '#E5E5EA', height: 60, paddingBottom: 8 },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: 'Главная', tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>🏠</Text> }}
      />
      <Tab.Screen
        name="Catalog"
        component={CatalogScreen}
        options={{ tabBarLabel: 'Каталог', tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>💧</Text> }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Профиль', tabBarIcon: ({ color }) => <Text style={{ fontSize: 22, color }}>👤</Text> }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  // null = ещё проверяем, true = залогинен, false = не залогинен
  const [isLoggedIn, setIsLoggedIn] = useState(null);

  useEffect(() => {
    // Проверяем сохранённую сессию при запуске
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });

    // Слушаем изменения сессии (вход / выход)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Пока проверяем сессию — показываем экран загрузки
  if (isLoggedIn === null) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isLoggedIn ? (
          // Авторизован — сразу в главное приложение
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="Order" component={OrderScreen} />
            <Stack.Screen name="WaterDetail" component={WaterDetailScreen} />
          </>
        ) : (
          // Не авторизован — экраны входа
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}