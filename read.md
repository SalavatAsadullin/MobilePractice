# Практическая работа №6
## Тема: Глобальное состояние приложения (Context API)

### Шаг 1. Создание глобального контекста приложения
На этом этапе создан файл глобального состояния `AppContext.js`.  
В нём объявлены `AppContext`, провайдер `AppProvider` и хук `useAppContext()` для доступа к данным из любого экрана.

**Листинг 1. Создание контекста в `src/context/AppContext.js`**
```javascript
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
```

**Место для скриншота:**  
[Скриншот 1 — файл `AppContext.js`, объявление `createContext` и `AppProvider`]

---

### Шаг 2. Реализация логики корзины в глобальном состоянии
Добавлены методы для управления корзиной: добавление товара, удаление, изменение количества и очистка.  
Также рассчитаны производные данные: общая сумма и общее количество товаров.

**Листинг 2. Логика корзины в `src/context/AppContext.js`**
```javascript
const addToCart = useCallback((product, quantity = 1) => {
  setCart((prev) => {
    const existing = prev.find((item) => item.product.id === product.id);
    if (existing) {
      return prev.map((item) =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
    }
    return [...prev, { product, quantity }];
  });
}, []);

const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
```

**Место для скриншота:**  
[Скриншот 2 — методы `addToCart`, `removeFromCart`, `updateCartQuantity`, `clearCart`]

---

### Шаг 3. Подключение провайдера к корню приложения
Чтобы контекст был доступен на всех экранах, приложение обёрнуто в `<AppProvider>` в `App.js`.

**Листинг 3. Подключение `AppProvider` в `App.js`**
```javascript
return (
  <AppProvider>
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isLoggedIn ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
```

**Место для скриншота:**  
[Скриншот 3 — корень приложения с обёрткой `AppProvider`]

---

### Шаг 4. Использование контекста на разных экранах
На экранах приложения данные берутся напрямую из контекста через `useAppContext()`.  
Например: в каталоге добавляется товар в корзину, в таб-баре показывается бейдж количества, в корзине изменяются позиции.

**Листинг 4. Использование контекста в `src/screens/CatalogScreen.js`**
```javascript
const { addToCart } = useAppContext();

const handleAddToCart = (product) => {
  addToCart(product);
};
```

**Листинг 5. Использование контекста в `App.js` (бейдж корзины)**
```javascript
function MainTabs() {
  const { cartCount } = useAppContext();
```

**Место для скриншота:**  
[Скриншот 4 — добавление товара в каталоге и обновление бейджа корзины]

---

### Шаг 5. Работа с данными пользователя через глобальный контекст
В `AppContext` реализована загрузка профиля текущего пользователя из Supabase и подписка на события авторизации.  
Это обеспечивает единое состояние пользователя для всех экранов.

**Листинг 6. Загрузка профиля и подписка в `src/context/AppContext.js`**
```javascript
const loadUserProfile = useCallback(async () => {
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) {
    setUser(null);
    return;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, phone')
    .eq('id', authUser.id)
    .single();

  setUser({
    id: authUser.id,
    email: authUser.email,
    name: profile?.name || '',
    phone: profile?.phone || '',
  });
}, []);
```

**Место для скриншота:**  
[Скриншот 5 — профиль пользователя на экране `Profile`]

---

## Вывод
В ходе практической работы реализовано глобальное состояние на `Context API`, которое позволило:

1. хранить данные пользователя и корзины в одном месте;
2. использовать эти данные на разных экранах без передачи через props;
3. централизовать логику корзины и упростить поддержку кода;
4. синхронно обновлять интерфейс приложения при изменении состояния.
