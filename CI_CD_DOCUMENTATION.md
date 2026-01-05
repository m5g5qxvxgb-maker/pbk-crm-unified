# 🚀 CI/CD Pipeline Documentation

## Обзор

Проект использует GitHub Actions для автоматизации тестирования и проверки качества кода.

## Workflow: CI/CD Pipeline

Файл: `.github/workflows/ci.yml`

### Триггеры

Pipeline запускается при:
- Push в ветки: `main`, `master`, `develop`
- Pull Request в ветки: `main`, `master`, `develop`

### Jobs

#### 1. Backend Tests
- **Платформа:** Ubuntu Latest
- **Node.js:** v18
- **База данных:** PostgreSQL 15 (test container)
- **Шаги:**
  - Установка зависимостей
  - Линтинг (если есть)
  - Запуск unit тестов с coverage
  - Загрузка coverage в Codecov

**Переменные окружения:**
```bash
NODE_ENV=test
DATABASE_URL=postgresql://test_user:test_password@localhost:5432/test_db
JWT_SECRET=test_jwt_secret_for_ci
```

#### 2. Frontend Tests
- **Платформа:** Ubuntu Latest
- **Node.js:** v18
- **Шаги:**
  - Установка зависимостей
  - Линтинг
  - Type checking (TypeScript)
  - Запуск unit тестов с coverage (Vitest)
  - Build frontend
  - Загрузка coverage в Codecov

#### 3. E2E Tests
- **Зависимости:** backend-tests, frontend-tests
- **Платформа:** Ubuntu Latest
- **База данных:** PostgreSQL 15 (test container)
- **Шаги:**
  - Установка зависимостей
  - Миграции и seed базы данных
  - Запуск backend на порту 5002
  - Запуск frontend на порту 3000
  - Установка Playwright
  - Запуск E2E тестов
  - Сохранение артефактов при ошибках

#### 4. Docker Build Test
- **Шаги:**
  - Сборка backend Docker image
  - Сборка frontend Docker image
  - Сборка telegram-bot Docker image
  - Использование GitHub Actions cache

#### 5. Security Scan
- **Инструменты:**
  - Trivy vulnerability scanner
  - NPM Audit (backend)
  - NPM Audit (frontend)
- **Результаты:** Загружаются в GitHub Security tab

#### 6. Notify Success
- **Зависимости:** Все остальные jobs
- **Условие:** Все проверки прошли успешно
- **Действие:** Вывод сообщения об успехе

## Локальный запуск тестов

### Backend тесты
```bash
cd backend
npm test                    # Запустить тесты
npm run test:coverage       # С coverage
npm run test:watch          # Watch mode
npm run coverage:check      # Проверить threshold (60%)
```

### Frontend тесты
```bash
cd frontend
npm test                    # Vitest
npm run test:coverage       # С coverage
npm run test:watch          # Watch mode
npm run test:ui             # Vitest UI
```

### E2E тесты
```bash
npm run test:e2e            # Playwright tests
```

### Все тесты
```bash
npm test                    # Backend + Frontend
npm run coverage            # Все с coverage
npm run coverage:check      # Проверка threshold
```

## Coverage Thresholds

Минимальные требования к покрытию кода:

- **Backend:** 60% lines coverage
- **Frontend:** 60% lines coverage

## Codecov Integration

Coverage отчёты автоматически загружаются в Codecov:
- Backend coverage: флаг `backend`
- Frontend coverage: флаг `frontend`

Для работы требуется `CODECOV_TOKEN` в GitHub Secrets.

## GitHub Secrets

Необходимые секреты для CI/CD:

| Секрет | Описание | Обязательно |
|--------|----------|-------------|
| `CODECOV_TOKEN` | Токен для Codecov | Нет (optional) |

## Статусные бейджи

Добавьте в README.md:

```markdown
![CI/CD](https://github.com/YOUR_USERNAME/pbk-crm-unified/workflows/CI%2FCD%20Pipeline/badge.svg)
[![codecov](https://codecov.io/gh/YOUR_USERNAME/pbk-crm-unified/branch/master/graph/badge.svg)](https://codecov.io/gh/YOUR_USERNAME/pbk-crm-unified)
```

## Debugging CI

### Просмотр логов
1. Перейти в GitHub → Actions
2. Выбрать workflow run
3. Кликнуть на job для просмотра логов

### Локальное тестирование workflow
Используйте [act](https://github.com/nektos/act):

```bash
# Установить act
brew install act  # macOS
# или
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Запустить workflow локально
act push

# Запустить конкретный job
act -j backend-tests
```

## Оптимизация скорости CI

Текущие оптимизации:
- ✅ Кэширование npm зависимостей
- ✅ Кэширование Docker layers
- ✅ Параллельный запуск тестов
- ✅ GitHub Actions cache для Docker build

Типичное время выполнения:
- Backend tests: ~2-3 минуты
- Frontend tests: ~3-4 минуты
- E2E tests: ~5-7 минут
- Docker build: ~4-6 минут
- Security scan: ~2-3 минуты

**Total:** ~15-20 минут

## Troubleshooting

### Тесты падают в CI, но работают локально
1. Проверить переменные окружения
2. Проверить версию Node.js (должна быть 18)
3. Проверить PostgreSQL версию (должна быть 15)

### Docker build fails
1. Проверить Dockerfile синтаксис
2. Проверить .dockerignore
3. Проверить наличие package-lock.json

### Coverage ниже threshold
```bash
npm run test:coverage
# Посмотреть какие файлы не покрыты
open coverage/lcov-report/index.html
```

## Следующие шаги

- [ ] Настроить branch protection rules
- [ ] Добавить required status checks
- [ ] Настроить auto-merge для Dependabot
- [ ] Добавить deployment job для production
- [ ] Настроить notifications (Slack/Telegram)

## Полезные ссылки

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Jest Coverage Documentation](https://jestjs.io/docs/configuration#collectcoverage-boolean)
- [Vitest Coverage Documentation](https://vitest.dev/guide/coverage.html)
- [Playwright Documentation](https://playwright.dev/)
