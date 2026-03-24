# Практическая работа №8: Аутентификация и профиль пользователя

## Краткая теория

Аутентификация в мобильном приложении нужна для идентификации пользователя и защиты персональных данных.  
Базовый сценарий включает регистрацию, вход и хранение сессии.

В React Native для этого удобно использовать Supabase Auth:

- `signUp` — регистрация по `email/password`;
- `signInWithPassword` — вход по `email/password`;
- `getSession` — проверка текущей сессии при запуске;
- `onAuthStateChange` — реакция на вход/выход пользователя в реальном времени.

Профиль пользователя обычно хранится отдельно (например, таблица `profiles`), где содержатся дополнительные данные: имя, телефон и т.д. Затем эти данные отображаются на экране профиля.

В данном проекте подтверждение email отключено, поэтому после регистрации пользователь может сразу войти в приложение.

---

## Шаг 1. Создание экрана регистрации

Был реализован экран регистрации с полями: имя, email, телефон, пароль и подтверждение пароля.  
Добавлена валидация данных формы.

```javascript
const [form, setForm] = useState({
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
});
```

```javascript
if (!form.email.trim()) newErrors.email = 'Введите email';
else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Некорректный email';

if (!form.password) newErrors.password = 'Введите пароль';
else if (form.password.length < 6) newErrors.password = 'Минимум 6 символов';
```

---

## Шаг 2. Реализация регистрации через email/password

В обработчике регистрации используется Supabase Auth для создания аккаунта, после чего имя и телефон сохраняются в таблицу `profiles`.

```javascript
const { data, error: signUpError } = await supabase.auth.signUp({
  email: form.email,
  password: form.password,
});
```

```javascript
const { error: profileError } = await supabase
  .from('profiles')
  .insert([{
    id: data.user.id,
    name: form.name.trim(),
    phone: form.phone,
  }]);
```

---

## Шаг 3. Создание экрана входа

Был реализован экран входа с полями email и пароль, а также базовой валидацией перед запросом.

```javascript
const [form, setForm] = useState({ email: '', password: '' });
```

```javascript
if (!form.email.trim()) newErrors.email = 'Введите email';
if (!form.password) newErrors.password = 'Введите пароль';
```

---

## Шаг 4. Реализация входа через email/password

Вход выполняется через метод `signInWithPassword`. При ошибке показывается сообщение, при успехе сессия становится активной.

```javascript
const { error } = await supabase.auth.signInWithPassword({
  email: form.email,
  password: form.password,
});
```

---

## Шаг 5. Управление сессией и навигацией

В `App.js` реализована проверка сессии при старте и подписка на изменения состояния авторизации.  
На основе `isLoggedIn` приложение показывает либо auth-экраны, либо основную часть приложения.

```javascript
supabase.auth.getSession().then(({ data: { session } }) => {
  setIsLoggedIn(!!session);
});
```

```javascript
const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
  setIsLoggedIn(!!session);
});
```

---

## Шаг 6. Отображение данных текущего пользователя в профиле

В контексте реализована загрузка профиля текущего пользователя (`name`, `phone`) из таблицы `profiles`, затем данные отображаются на экране профиля.

```javascript
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
```

```javascript
<Text style={styles.name}>{user?.name || '—'}</Text>
<Text style={styles.email}>{user?.email || '—'}</Text>
{user?.phone ? <Text style={styles.phone}>{user.phone}</Text> : null}
```

---

## Вывод

В ходе практической работы №8 реализована полноценная система аутентификации и профиля пользователя:

- созданы экраны регистрации и входа;
- выполнена аутентификация по `email/password`;
- настроено управление сессией и переходами между экранами;
- реализовано хранение и отображение данных текущего пользователя в профиле.

Таким образом, техническое задание практики выполнено в полном объёме.
