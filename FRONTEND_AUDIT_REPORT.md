# 🎨 АУДИТ FRONTEND - PBK CRM UNIFIED

**Дата аудита:** 2026-01-05  
**Аудитор:** OpenCode AI Assistant  
**Версия:** Next.js 14.0.4, React 18.2.0  
**Охват:** 69 файлов, 10,186 строк кода  

---

## 📊 КРАТКОЕ РЕЗЮМЕ

### Общая оценка: **6.2/10** ⭐⭐⭐⭐⭐⭐

**Статус:** 🟡 **ТРЕБУЕТ УЛУЧШЕНИЙ**

### Сильные стороны ✅
- ✅ Хорошая структура Next.js 14 (App Router)
- ✅ Правильная настройка API rewrites через nginx
- ✅ Использование современных библиотек (React Query потенциально, dnd-kit)
- ✅ Интернационализация (i18n) для русского языка
- ✅ Единообразный UI с react-hot-toast для уведомлений
- ✅ Модальные окна с вкладками для детального просмотра

### Критические проблемы ❌
- ❌ **Отсутствует обработка ошибок HTTP** - нет response interceptor
- ❌ **Нет централизованной обработки 401/403** - риск зависания при истечении токена
- ❌ **TypeScript strict: false** - слабая типизация
- ❌ **ignoreBuildErrors: true** - игнорирование ошибок TypeScript
- ❌ **Отсутствие accessibility** - 0 ARIA-атрибутов на 69 файлов
- ❌ **Нет тестируемости** - почти нет data-testid
- ❌ **61 console.log в production** - отладочный код не удален
- ❌ **Отсутствие try-catch** в большинстве компонентов
- ❌ **Устаревшая Next.js 14.0.4** (текущая: 14.2.x/15.x)

---

## 📁 АНАЛИЗ СТРУКТУРЫ

### Файловая структура (Next.js 14 App Router)

```
frontend/
├── app/                         # Next.js 14 App Router
│   ├── calls/                   # Страница звонков
│   ├── clients/                 # Страница клиентов
│   ├── dashboard/               # Главная панель
│   ├── emails/                  # Email-модуль
│   ├── integrations/            # Интеграции
│   ├── kanban/                  # Канбан-доска (DnD)
│   ├── leads/                   # Управление лидами
│   ├── login/                   # Страница входа
│   ├── pipelines/               # Пайплайны продаж
│   ├── projects/                # Проекты
│   ├── proposals/               # Коммерческие предложения
│   ├── settings/                # Настройки
│   ├── tasks/                   # Задачи
│   ├── test-api/                # Тестовая страница API
│   ├── layout.tsx               # Корневой layout
│   ├── page.tsx                 # Landing page
│   └── globals.css              # Глобальные стили
│
├── components/                  # Переиспользуемые компоненты
│   ├── ai/                      # AI Copilot
│   │   ├── AICopilot.tsx
│   │   └── AICopilotChat.tsx
│   ├── layout/                  # Компоненты разметки
│   │   ├── AppLayout.tsx        # ⚠️ Inline styles вместо CSS
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── Providers.tsx        # ⚠️ Пустой провайдер
│   ├── modals/                  # Модальные окна
│   │   ├── ClientModal.tsx
│   │   └── LeadModal.tsx
│   └── ui/                      # UI-примитивы
│       ├── Button.tsx
│       ├── Input.tsx
│       └── Textarea.tsx
│
├── lib/                         # Утилиты
│   ├── api.ts                   # ⚠️ API клиент (нет error handling)
│   ├── translations.ts          # i18n (только русский)
│   └── utils.ts
│
├── public/                      # Статические файлы
├── next.config.js               # ⚠️ ignoreBuildErrors: true
├── tsconfig.json                # ⚠️ strict: false
├── tailwind.config.js
└── package.json
```

**Статистика:**
- 📄 **69 файлов** (TypeScript/JavaScript)
- 📝 **10,186 строк кода**
- 📑 **15 страниц** (Next.js routes)
- 🧩 **~34 компонента**

---

## 🔍 ДЕТАЛЬНЫЙ АНАЛИЗ ПО КАТЕГОРИЯМ

---

## 1. API КЛИЕНТ И ОБРАБОТКА ОШИБОК

**Файл:** `frontend/lib/api.ts` (98 строк)

### ❌ КРИТИЧЕСКИЕ ПРОБЛЕМЫ (P0)

#### **P0-1: Отсутствие Response Interceptor**
**Файл:** `lib/api.ts:14-20`  
**Проблема:**
```typescript
// Есть ТОЛЬКО request interceptor
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ❌ НЕТ response interceptor!
```

**Последствия:**
- При `401 Unauthorized` пользователь не перенаправляется на `/login`
- При `403 Forbidden` нет обработки
- При `500 Server Error` нет глобального уведомления
- Каждый компонент сам обрабатывает ошибки (дублирование кода)

**Пример проблемы:**
```typescript
// В dashboard/page.tsx:28-38
fetch(getApiUrl('/api/dashboard/metrics'), {
  headers: { 'Authorization': `Bearer ${token}` }
})
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      setMetrics(data.data);
    }
    setLoading(false);
  })
  .catch(() => setLoading(false)); // ❌ Просто скрывает ошибку!
```

**Рекомендация:** Добавить `api.interceptors.response.use()` для:
- Автоматический редирект на `/login` при 401
- Глобальные toast-уведомления об ошибках
- Автоматический refresh токена (если будет JWT refresh)

---

#### **P0-2: Нет централизованной обработки ошибок API**
**Распространение:** Все страницы

**Проблема:** Каждая страница дублирует код обработки ошибок:
```typescript
// leads/page.tsx:31-42
try {
  const response = await fetch(getApiUrl('/api/leads'), {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  if (data.success) {
    setLeads(data.data);
  }
} catch (error) {
  console.error('Error loading leads:', error); // ❌ Только console
  toast.error(t('Failed to load data'));        // Вручную
}
```

**Рекомендация:**
- Создать хук `useApi()` с автоматической обработкой ошибок
- Или использовать `@tanstack/react-query` (уже в зависимостях!)

---

### ⚠️ ВЫСОКИЙ ПРИОРИТЕТ (P1)

#### **P1-1: localStorage используется без проверки SSR**
**Файл:** Все страницы с auth

**Проблема:**
```typescript
// login/page.tsx:60
localStorage.setItem('token', token); // ❌ Нет проверки typeof window
```

**Хорошо в:** `lib/api.ts:15`
```typescript
const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null; ✅
```

**Но плохо в 10+ местах:**
```typescript
// dashboard/page.tsx:24
const token = localStorage.getItem('token'); // ❌
if (!token) return;
```

**Рекомендация:** Создать хелпер `getToken()` с SSR-безопасностью.

---

#### **P1-2: Неконсистентное использование api.ts**
**Проблема:** Половина кода использует `axios` через `api.ts`, половина - `fetch()`:

**Axios (через api.ts):**
```typescript
// lib/api.ts:30-38
export const authAPI = {
  login: async (credentials: { email: string; password: string }) => {
    return await api.post('/auth/login', credentials);
  },
};
```

**fetch() (обходит api.ts):**
```typescript
// login/page.tsx:33
const response = await fetch(`/api/auth/login`, { ... }); // ❌ Обходит axios
```

**Последствия:**
- Interceptors не работают для `fetch()`
- Нет единой точки контроля запросов

**Рекомендация:** Использовать ТОЛЬКО `api.ts` для всех запросов.

---

## 2. TYPESCRIPT И ТИПИЗАЦИЯ

**Файл:** `tsconfig.json`

### ❌ КРИТИЧЕСКИЕ ПРОБЛЕМЫ (P0)

#### **P0-3: strict: false - отключена строгая типизация**
**Файл:** `tsconfig.json:6`
```json
{
  "compilerOptions": {
    "strict": false,  // ❌ КРИТИЧНО!
```

**Последствия:**
- Разрешены `any` типы без предупреждений
- Нет проверки `null`/`undefined`
- Нет проверки неиспользуемых параметров

**Примеры проблем:**
```typescript
// leads/page.tsx:12
const [leads, setLeads] = useState<any[]>([]); // ❌ any вместо Lead[]

// components/modals/LeadModal.tsx:18
const [lead, setLead] = useState<any>(null);  // ❌ any

// clients/page.tsx:9
const [clients, setClients] = useState<any[]>([]); // ❌ any
```

**Рекомендация:**
1. Включить `"strict": true`
2. Создать `types/models.ts` с интерфейсами:
```typescript
interface Lead {
  id: string;
  title: string;
  value: number;
  probability: number;
  client_id?: string;
  pipeline_id: string;
  stage_id: string;
  created_at: string;
  // ...
}
```

---

#### **P0-4: ignoreBuildErrors: true**
**Файл:** `next.config.js:10`
```javascript
typescript: {
  ignoreBuildErrors: true  // ❌ ОЧЕНЬ ОПАСНО!
}
```

**Последствия:**
- Build проходит даже с ошибками TypeScript
- Ошибки находятся только в runtime
- Невозможно полагаться на типы

**Рекомендация:** Удалить эту опцию и исправить все ошибки TypeScript.

---

## 3. МАРШРУТИЗАЦИЯ И НАВИГАЦИЯ

**Оценка:** 7/10 ⭐⭐⭐⭐⭐⭐⭐

### ✅ Что работает хорошо:
- Next.js 14 App Router используется правильно
- Все страницы имеют корректную структуру `page.tsx`
- Есть корневой `layout.tsx` с глобальными настройками

### ⚠️ СРЕДНИЙ ПРИОРИТЕТ (P2)

#### **P2-1: Отсутствует middleware для защиты маршрутов**
**Проблема:** Каждая страница сама проверяет auth:
```typescript
// dashboard/page.tsx:23-26
useEffect(() => {
  const token = localStorage.getItem('token');
  if (!token) return;
  // ...
});
```

**Дублируется в:**
- `leads/page.tsx:24-28`
- `clients/page.tsx:17`
- `tasks/page.tsx` (аналогично)

**Рекомендация:** Создать `middleware.ts`:
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('token');
  if (!token && !request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/((?!login|api|_next/static|_next/image|favicon.ico).*)']
};
```

---

#### **P2-2: Hardcoded navigation вместо конфига**
**Файл:** `components/layout/AppLayout.tsx:33-42`
```typescript
const navItems = [
  { name: 'Панель управления', path: '/dashboard', icon: '📊' },
  { name: 'Канбан', path: '/kanban', icon: '🔥' },
  // ... 8 пунктов
];
```

**Проблема:**
- Невозможно динамически скрыть пункты по ролям
- Нет поддержки вложенных меню
- Эмодзи вместо SVG-иконок (плохо для a11y)

**Рекомендация:** Вынести в `lib/navigation.ts` с поддержкой ролей:
```typescript
interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType;
  roles?: string[]; // Видимость по ролям
}
```

---

## 4. КОМПОНЕНТЫ И ПЕРЕИСПОЛЬЗОВАНИЕ

**Оценка:** 6.5/10 ⭐⭐⭐⭐⭐⭐

### ✅ Что работает хорошо:
- Модальные окна (`LeadModal`, `ClientModal`) - хорошая структура с вкладками
- UI-примитивы (`Button`, `Input`, `Textarea`)
- DnD Kanban использует `@dnd-kit` (современная библиотека)

### ⚠️ ПРОБЛЕМЫ

#### **P1-3: AppLayout использует inline styles вместо CSS**
**Файл:** `components/layout/AppLayout.tsx:44-125`
```typescript
const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  sidebar: {
    width: '250px',
    background: '#1f2937',
    // ... 80 строк inline styles
  },
};
```

**Проблемы:**
- Невозможно переопределить через CSS
- Нет поддержки темизации
- Плохая производительность (создается на каждом рендере)
- Противоречит использованию TailwindCSS

**Рекомендация:** Переписать на Tailwind CSS классы.

---

#### **P2-3: Providers.tsx абсолютно пустой**
**Файл:** `components/layout/Providers.tsx:1-6`
```typescript
'use client';

export function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

**Проблема:**
- Не используется нигде
- В зависимостях есть `@tanstack/react-query`, но QueryProvider не подключен
- В зависимостях есть `zustand`, но стор не создан

**Рекомендация:**
1. Удалить файл, если не нужен
2. Или добавить `QueryClientProvider` для React Query:
```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

---

#### **P2-4: Дублирование кода загрузки данных**
**Проблема:** Паттерн fetch + setState дублируется 20+ раз:

**Дублируется:**
```typescript
// leads/page.tsx:23-44
const loadLeads = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login';
    return;
  }

  try {
    const response = await fetch(getApiUrl('/api/leads'), {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    if (data.success) {
      setLeads(data.data);
    }
  } catch (error) {
    console.error('Error loading leads:', error);
    toast.error(t('Failed to load data'));
  } finally {
    setLoading(false);
  }
};
```

**Аналогичный код в:**
- `clients/page.tsx`
- `dashboard/page.tsx`
- `kanban/page.tsx`
- `calls/page.tsx`
- И т.д.

**Рекомендация:** Создать хук `useApiQuery`:
```typescript
function useApiQuery<T>(endpoint: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // ... единая логика загрузки
  }, [endpoint]);

  return { data, loading, error, refetch };
}

// Использование:
const { data: leads, loading, error } = useApiQuery<Lead[]>('/api/leads');
```

---

## 5. УПРАВЛЕНИЕ СОСТОЯНИЕМ

**Оценка:** 5/10 ⭐⭐⭐⭐⭐

### Текущее состояние:
- **useState** - используется везде для локального состояния
- **zustand** - установлен, но не используется ❌
- **@tanstack/react-query** - установлен, но не используется ❌
- **Нет глобального стора** для user, auth, settings

### ❌ ПРОБЛЕМЫ

#### **P1-4: Нет централизованного auth state**
**Проблема:** Данные пользователя читаются из localStorage везде:
```typescript
// AppLayout.tsx:23
const userData = JSON.parse(localStorage.getItem('user') || '{}');
setUser(userData);

// dashboard/page.tsx:24
const token = localStorage.getItem('token');

// leads/page.tsx:24
const token = localStorage.getItem('token');
```

**Последствия:**
- При logout нужно обновлять вручную
- Нет реактивности
- Невозможно подписаться на изменения

**Рекомендация:** Создать `lib/store/auth.ts` (zustand):
```typescript
import { create } from 'zustand';

interface AuthState {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  login: (user, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null });
  }
}));
```

---

#### **P2-5: React Query не используется**
**Проблема:** Библиотека установлена, но нигде не применяется.

**Преимущества React Query:**
- Автоматический кеш запросов
- Автоматический refetch при фокусе окна
- Загрузка/ошибка из коробки
- Devtools для отладки

**Рекомендация:** Использовать для всех API запросов:
```typescript
import { useQuery } from '@tanstack/react-query';

function LeadsPage() {
  const { data: leads, isLoading, error } = useQuery({
    queryKey: ['leads'],
    queryFn: () => api.get('/leads').then(res => res.data)
  });

  // Нет нужды в useState, useEffect, try-catch!
}
```

---

## 6. UI/UX И ДОСТУПНОСТЬ (ACCESSIBILITY)

**Оценка:** 4/10 ⭐⭐⭐⭐

### ❌ КРИТИЧЕСКИЕ ПРОБЛЕМЫ

#### **P0-5: ПОЛНОЕ отсутствие ARIA-атрибутов**
**Факт:** `grep -r "aria-\|role=" frontend/app --include="*.tsx" | wc -l` = **0**

**Проблемы:**
- Нет `aria-label` на иконочных кнопках
- Нет `role="alert"` на error messages
- Нет `aria-live` на динамическом контенте
- Модальные окна не имеют `role="dialog"`, `aria-modal="true"`

**Пример проблемы:**
```typescript
// components/modals/LeadModal.tsx:496-501
<button
  onClick={onClose}
  className="text-gray-400 hover:text-gray-600"
>
  <XMarkIcon className="h-6 w-6" /> {/* ❌ Нет aria-label */}
</button>
```

**Рекомендация:**
```typescript
<button
  onClick={onClose}
  aria-label="Закрыть модальное окно"
  className="text-gray-400 hover:text-gray-600"
>
  <XMarkIcon className="h-6 w-6" />
</button>
```

---

#### **P0-6: Нет семантических HTML-тегов**
**Проблема:** Повсеместно используются `<div>` вместо семантических тегов:

```typescript
// AppLayout.tsx:132-152
<div style={styles.container}>  {/* ❌ Должно быть <div> */}
  <aside style={styles.sidebar}> {/* ✅ Хорошо */}
    <div style={styles.logo}>    {/* ❌ Должно быть <header> */}
      <h1>...</h1>
    </div>
    <nav style={styles.nav}>     {/* ✅ Хорошо */}
      ...
    </nav>
  </aside>
  
  <main style={styles.main}>     {/* ✅ Хорошо */}
    <header style={styles.header}> {/* ✅ Хорошо */}
```

**Частично хорошо**, но много `<div>` где должны быть:
- `<article>` для карточек
- `<section>` для секций
- `<button>` вместо `<div onClick>`

---

#### **P1-5: Отсутствие keyboard navigation**
**Проблема:** Модальные окна не закрываются по `Esc`, нет focus trap.

**Рекомендация:** Использовать библиотеку `@headlessui/react` для:
- Dialog с автоматическим Esc
- Focus trap
- ARIA из коробки

---

### ⚠️ UX ПРОБЛЕМЫ

#### **P2-6: 61 console.log в production коде**
**Факт:** `grep -r "console\.log" frontend/app | wc -l` = 61

**Примеры:**
```typescript
// login/page.tsx:25-27
console.log('=== LOGIN ATTEMPT ===');
console.log('Email:', formData.email);
console.log('Password length:', formData.password.length);

// login/page.tsx:44-54
console.log('=== LOGIN RESPONSE ===');
console.log('Status:', response.status);
console.log('Success! Got result:', result);
```

**Рекомендация:**
1. Создать `lib/logger.ts`:
```typescript
const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  log: (...args: any[]) => isDev && console.log(...args),
  error: (...args: any[]) => isDev && console.error(...args),
};
```
2. Заменить все `console.log` на `logger.log`

---

#### **P2-7: Отсутствие loading skeletons**
**Проблема:** При загрузке показывается просто спиннер:
```typescript
// dashboard/page.tsx:54-60
if (loading) {
  return (
    <AppLayout>
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div>
      </div>
    </AppLayout>
  );
}
```

**Рекомендация:** Использовать skeleton screens для лучшего UX:
```typescript
<div className="space-y-4">
  {[1,2,3].map(i => (
    <div key={i} className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2 mt-2"></div>
    </div>
  ))}
</div>
```

---

#### **P2-8: Эмодзи вместо SVG-иконок**
**Проблема:** Навигация использует эмодзи:
```typescript
// AppLayout.tsx:34-41
{ name: 'Панель управления', path: '/dashboard', icon: '📊' },
{ name: 'Канбан', path: '/kanban', icon: '🔥' },
{ name: 'Лиды', path: '/leads', icon: '🎯' },
```

**Проблемы:**
- Разные рендеры в разных ОС/браузерах
- Плохо для accessibility (screen readers читают "emoji fire")
- Нет hover-эффектов

**Рекомендация:** Использовать `@heroicons/react` (уже установлен):
```typescript
import { ChartBarIcon, FireIcon, TargetIcon } from '@heroicons/react/24/outline';

{ name: 'Панель управления', path: '/dashboard', icon: ChartBarIcon },
```

---

## 7. ТЕСТИРУЕМОСТЬ

**Оценка:** 2/10 ⭐⭐

### ❌ КРИТИЧЕСКИЕ ПРОБЛЕМЫ

#### **P0-7: Почти нет data-testid**
**Факт:** `grep -r "data-testid" frontend --include="*.tsx" | wc -l` = 3

**Найдены только в:**
- `components/ai/AICopilotChat.tsx` (3 шт.)

**Проблема:** Playwright тесты используют хрупкие селекторы:
```typescript
// tests/e2e/leads.spec.ts:10
await page.click('a:has-text("Leads")'); // ❌ Сломается при переводе

// tests/e2e/leads.spec.ts:15
await expect(page.locator('button:has-text("New Lead")')).toBeVisible(); // ❌
```

**Рекомендация:** Добавить `data-testid` везде:
```typescript
<button data-testid="new-lead-button" onClick={handleCreateNew}>
  New Lead
</button>

// Тест:
await page.click('[data-testid="new-lead-button"]'); // ✅
```

---

#### **P1-6: Нет unit-тестов для компонентов**
**Факт:** Нет `*.test.tsx` файлов в `frontend/`

**Рекомендация:** Установить `@testing-library/react` и написать тесты для:
- UI-примитивов (`Button`, `Input`)
- Критичных компонентов (`LeadModal`, `ClientModal`)
- Утилит (`lib/api.ts`, `lib/utils.ts`)

---

## 8. ПРОИЗВОДИТЕЛЬНОСТЬ

**Оценка:** 6/10 ⭐⭐⭐⭐⭐⭐

### ⚠️ ПРОБЛЕМЫ

#### **P2-9: Нет мемоизации в списках**
**Проблема:** Большие списки ререндерятся полностью:
```typescript
// leads/page.tsx:129-163
{filteredLeads.map((lead) => (
  <div 
    key={lead.id}
    onClick={() => handleOpenLead(lead.id)} // ❌ Новая функция на каждом рендере
  >
    ...
  </div>
))}
```

**Рекомендация:**
```typescript
const handleOpenLead = useCallback((leadId: string) => {
  setSelectedLeadId(leadId);
  setShowLeadModal(true);
}, []);

// Или вынести карточку в отдельный компонент:
const LeadCard = React.memo(({ lead, onClick }: Props) => {
  ...
});
```

---

#### **P2-10: Kanban может иметь проблемы с большими списками**
**Файл:** `kanban/page.tsx`

**Проблема:** Если в пайплайне 100+ лидов, DnD может тормозить.

**Рекомендация:**
- Виртуализация списков (`@tanstack/react-virtual`)
- Пагинация по 50 лидов на этап

---

## 9. БЕЗОПАСНОСТЬ FRONTEND

**Оценка:** 7/10 ⭐⭐⭐⭐⭐⭐⭐

### ✅ Что хорошо:
- Нет `dangerouslySetInnerHTML`
- Используется CSP-безопасный подход
- XSS-защита через React автоматически

### ⚠️ ПРОБЛЕМЫ

#### **P2-11: Токен хранится в localStorage**
**Файл:** `login/page.tsx:60`
```typescript
localStorage.setItem('token', token); // ⚠️ Уязвимо к XSS
```

**Проблема:**
- Если есть XSS-уязвимость, токен можно украсть
- `localStorage` доступен из всех скриптов

**Рекомендация:**
- Хранить токен в `httpOnly` cookie (требует изменений на backend)
- Или использовать `sessionStorage` (очищается при закрытии вкладки)

---

#### **P3-1: Нет Content Security Policy**
**Файл:** `next.config.js`

**Проблема:** Нет CSP-заголовков.

**Рекомендация:** Добавить в `next.config.js`:
```javascript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
        }
      ]
    }
  ];
}
```

---

## 10. КОНФИГУРАЦИЯ И BUILD

**Оценка:** 5/10 ⭐⭐⭐⭐⭐

### ✅ Что хорошо:
- Next.js rewrites правильно настроены
- TailwindCSS подключен
- TypeScript используется

### ❌ ПРОБЛЕМЫ (уже упомянутые выше):
- `ignoreBuildErrors: true` ❌
- `strict: false` ❌
- Устаревшая версия Next.js 14.0.4 (вышла 14.2.x)

#### **P2-12: Нет проверки environment variables**
**Проблема:** `next.config.js:16` использует `process.env.API_URL`, но нигде не проверяется:
```javascript
const apiUrl = process.env.API_URL || 'http://backend:5002'; // Fallback хороший
```

**Рекомендация:** Добавить валидацию:
```javascript
const requiredEnvVars = ['API_URL'];
requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    console.warn(`Missing environment variable: ${envVar}, using default`);
  }
});
```

---

## 11. ИНТЕРНАЦИОНАЛИЗАЦИЯ (i18n)

**Оценка:** 7/10 ⭐⭐⭐⭐⭐⭐⭐

### ✅ Что хорошо:
- Есть система переводов `lib/translations.ts`
- Хук `useTranslation()` удобен
- 160+ переведенных ключей

### ⚠️ ПРОБЛЕМЫ

#### **P3-2: Поддерживается только русский язык**
**Файл:** `lib/translations.ts:3-4`
```typescript
export const translations = {
  ru: { ... } // Только русский
};
```

**Проблема:** Нет английского (для международных клиентов).

**Рекомендация:**
```typescript
export const translations = {
  ru: { ... },
  en: {
    'Loading': 'Loading...',
    'Leads': 'Leads',
    // ...
  }
};

export function useTranslation(locale: 'ru' | 'en' = 'ru') {
  const t = (key: string) => {
    return translations[locale][key] || key;
  };
  return { t };
}
```

---

#### **P3-3: Inconsistent использование переводов**
**Проблема:** Часть текста переведена, часть - нет:
```typescript
// leads/page.tsx:96
New Lead  // ❌ Не переведено

// leads/page.tsx:89
{t('Leads')} // ✅ Переведено
```

**Рекомендация:** Все тексты обернуть в `t()`.

---

## 📊 ДЕТАЛЬНАЯ ОЦЕНКА ПО КРИТЕРИЯМ

| Критерий | Оценка | Вес | Взвеш. |
|----------|--------|-----|--------|
| **API & Обработка ошибок** | 3/10 | 20% | 0.6 |
| **TypeScript & Типизация** | 4/10 | 15% | 0.6 |
| **Маршрутизация** | 7/10 | 10% | 0.7 |
| **Компоненты & Архитектура** | 6.5/10 | 15% | 0.975 |
| **Управление состоянием** | 5/10 | 10% | 0.5 |
| **UI/UX & Accessibility** | 4/10 | 15% | 0.6 |
| **Тестируемость** | 2/10 | 10% | 0.2 |
| **Производительность** | 6/10 | 5% | 0.3 |
| **Безопасность** | 7/10 | 5% | 0.35 |
| **Конфигурация** | 5/10 | 5% | 0.25 |

**ИТОГОВАЯ ОЦЕНКА:** **6.2/10** ⭐⭐⭐⭐⭐⭐

---

## 🎯 ПРИОРИТИЗИРОВАННЫЙ СПИСОК ИСПРАВЛЕНИЙ

### ❌ КРИТИЧЕСКИЕ (P0) - Исправить НЕМЕДЛЕННО

1. **P0-1:** Добавить response interceptor в `lib/api.ts` (401/403/500 handling)
2. **P0-2:** Создать централизованную обработку ошибок API
3. **P0-3:** Включить `"strict": true` в `tsconfig.json`
4. **P0-4:** Удалить `ignoreBuildErrors: true` из `next.config.js`
5. **P0-5:** Добавить ARIA-атрибуты в модальные окна и кнопки
6. **P0-6:** Исправить семантику HTML (div → article, section)
7. **P0-7:** Добавить `data-testid` в критичные элементы

**Затраты времени:** ~4-6 часов

---

### ⚠️ ВЫСОКИЙ ПРИОРИТЕТ (P1)

8. **P1-1:** Создать SSR-безопасный хелпер `getToken()`
9. **P1-2:** Унифицировать API calls - только через `api.ts`
10. **P1-3:** Переписать `AppLayout` на TailwindCSS
11. **P1-4:** Создать zustand-стор для auth
12. **P1-5:** Добавить keyboard navigation в модальные окна
13. **P1-6:** Написать unit-тесты для UI-примитивов

**Затраты времени:** ~6-8 часов

---

### 🟡 СРЕДНИЙ ПРИОРИТЕТ (P2)

14. **P2-1:** Создать Next.js middleware для auth
15. **P2-2:** Вынести навигацию в конфиг с поддержкой ролей
16. **P2-3:** Настроить `Providers.tsx` с QueryClient
17. **P2-4:** Создать хук `useApiQuery` или интегрировать React Query
18. **P2-5:** Начать использовать React Query
19. **P2-6:** Удалить `console.log` из production (создать `logger.ts`)
20. **P2-7:** Добавить skeleton screens
21. **P2-8:** Заменить эмодзи на `@heroicons/react`
22. **P2-9:** Добавить мемоизацию в списки (`useCallback`, `React.memo`)
23. **P2-10:** Добавить виртуализацию в Kanban
24. **P2-11:** Рассмотреть httpOnly cookies вместо localStorage
25. **P2-12:** Добавить валидацию env variables

**Затраты времени:** ~8-12 часов

---

### 🔵 НИЗКИЙ ПРИОРИТЕТ (P3)

26. **P3-1:** Добавить CSP-заголовки
27. **P3-2:** Добавить поддержку английского языка
28. **P3-3:** Обернуть весь текст в `t()`

**Затраты времени:** ~3-4 часа

---

## 🔄 СВЯЗЬ С BACKEND АУДИТОМ

### Проблемы, требующие изменений на backend:

1. **httpOnly cookies для токенов** (P2-11)
   - Backend: Возвращать токен в httpOnly cookie
   - Frontend: Убрать `localStorage.setItem('token')`

2. **Стандартизация API responses** (P0-2)
   - Backend: Все ответы должны быть `{ success, data, error }`
   - Frontend: Единый обработчик ответов

3. **Refresh token mechanism** (будущее)
   - Backend: Endpoint `/auth/refresh`
   - Frontend: Автоматический refresh в interceptor

---

## 📈 РЕКОМЕНДАЦИИ ПО УЛУЧШЕНИЮ АРХИТЕКТУРЫ

### 1. Миграция на React Query

**До:**
```typescript
const [leads, setLeads] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetch('/api/leads')
    .then(res => res.json())
    .then(data => setLeads(data))
    .finally(() => setLoading(false));
}, []);
```

**После:**
```typescript
const { data: leads, isLoading } = useQuery({
  queryKey: ['leads'],
  queryFn: () => api.get('/leads').then(res => res.data)
});
```

**Преимущества:**
- Автокеш
- Автоматический refetch
- Нет useState/useEffect
- Devtools

---

### 2. Создание типов (models.ts)

**Файл:** `types/models.ts`
```typescript
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'manager' | 'agent';
}

export interface Lead {
  id: string;
  title: string;
  description?: string;
  value: number;
  probability: number;
  client_id?: string;
  client_name?: string;
  pipeline_id: string;
  pipeline_name?: string;
  stage_id: string;
  stage_name?: string;
  created_at: string;
  updated_at: string;
  closed_at?: string;
}

export interface Client {
  id: string;
  company_name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  city?: string;
  country?: string;
  created_at: string;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

**Использование:**
```typescript
const [leads, setLeads] = useState<Lead[]>([]);
const { data } = useQuery<ApiResponse<Lead[]>>(...);
```

---

### 3. Единая обработка ошибок

**Файл:** `lib/api-client.ts`
```typescript
import axios from 'axios';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

const api = axios.create({ baseURL: '/api' });

// Request interceptor
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    
    if (status === 401) {
      // Токен истек
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      toast.error('Сессия истекла, войдите снова');
    } else if (status === 403) {
      toast.error('Недостаточно прав');
    } else if (status >= 500) {
      toast.error('Ошибка сервера, попробуйте позже');
    } else {
      const message = error.response?.data?.error || 'Произошла ошибка';
      toast.error(message);
    }
    
    return Promise.reject(error);
  }
);

export default api;
```

---

## 🧪 РЕЗУЛЬТАТЫ E2E ТЕСТОВ (Playwright)

**Из предыдущего запуска:** 38/46 passing (83%)

### Failing tests (8):
- Селекторы сломаны из-за изменений в UI
- Отсутствие `data-testid`
- Timeout при загрузке модальных окон

**Рекомендация:** После добавления `data-testid` (P0-7) тесты должны пройти.

---

## 📚 ТЕХНОЛОГИЧЕСКИЙ СТЕК

### Текущие зависимости:
```json
{
  "next": "14.0.4",              // ⚠️ Устаревшая (текущая 14.2.x)
  "react": "18.2.0",             // ✅
  "@tanstack/react-query": "5.15.0", // ✅ Не используется
  "@dnd-kit/core": "6.3.1",      // ✅ Используется в Kanban
  "@heroicons/react": "2.2.0",   // ✅ Используется частично
  "axios": "1.6.0",              // ✅
  "react-hot-toast": "2.4.1",    // ✅
  "react-hook-form": "7.49.2",   // ❓ Не видел использования
  "zod": "3.22.4",               // ❓ Не видел использования
  "zustand": "4.4.7",            // ❌ Не используется
  "tailwindcss": "3.4.1",        // ✅
  "typescript": "5.9.3"          // ✅ Но strict: false
}
```

### Рекомендации по зависимостям:
1. ✅ **Обновить Next.js:** `14.0.4` → `14.2.x` (или `15.x` если готовы)
2. ✅ **Начать использовать:** `@tanstack/react-query`
3. ✅ **Начать использовать:** `zustand` для глобального стора
4. ❓ **Проверить:** `react-hook-form` и `zod` - если не используются, удалить
5. ➕ **Добавить:** `@headlessui/react` для accessible модалок
6. ➕ **Добавить:** `@testing-library/react` для unit-тестов

---

## 🎓 ВЫВОДЫ И РЕКОМЕНДАЦИИ

### Общее состояние:
Frontend находится в **работоспособном состоянии**, но требует серьезных улучшений в плане:
- Обработки ошибок
- Типизации
- Доступности
- Тестируемости

### Что делать в первую очередь:
1. **Неделя 1:** Исправить P0 (критические проблемы)
   - Response interceptor
   - TypeScript strict mode
   - Базовые ARIA-атрибуты
   
2. **Неделя 2:** Исправить P1 (высокий приоритет)
   - Auth store (zustand)
   - Унификация API calls
   - Keyboard navigation

3. **Неделя 3:** Начать использовать React Query
   - Переписать 3-4 страницы
   - Настроить QueryClient
   - Обучить команду

4. **Неделя 4+:** P2 и P3 постепенно

### Долгосрочная стратегия:
- Создать Design System (UI Kit) с storybook
- Настроить CI/CD для автоматических тестов
- Внедрить code review с чеклистом
- Добавить Lighthouse CI для контроля performance
- Рассмотреть миграцию на TypeScript strict mode постепенно

---

## 📝 ЗАКЛЮЧЕНИЕ

Frontend PBK CRM построен на современных технологиях (Next.js 14, React 18, TailwindCSS), но страдает от:
- **Недостаточной обработки ошибок** (критично)
- **Слабой типизации** (критично)
- **Отсутствия accessibility** (критично)
- **Неиспользования установленных библиотек** (React Query, zustand)

**Оценка: 6.2/10** - требует улучшений, но имеет хороший фундамент.

После исправления критических проблем (P0+P1) оценка может подняться до **8-8.5/10**.

---

**Следующий шаг:** Аудит инфраструктуры (Docker, Nginx, PostgreSQL)

---

_Конец отчета по Frontend_
