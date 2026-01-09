# Фронтенд Bird
Веб-интерфейс для входа в систему, управления сообщениями и подписками. Работает
с UMS и Twitter API, хранит JWT-сессию и управляет доступом по ролям.

## Используемые технологии
- React 18 + TypeScript
- Vite, React Router
- Tailwind CSS, Headless UI, Heroicons
- Fetch API
- Nginx (в контейнере) + runtime-конфиг через `config.js`

## Требования
- Node.js 18+ (LTS)
- npm 9+ (идёт вместе с Node)

## Установка и запуск
```sh
npm install
npm run dev
```

Другие команды:
```sh
npm run build
npm run preview
npm run lint
```

Vite поднимет dev-сервер на http://localhost:5173.

## Конфигурация
UMS базовый URL берётся из `VITE_AUTH_BASE_URL` или runtime-конфига:
- локально: `VITE_AUTH_BASE_URL=http://localhost:9000` (лучше в `.env.local`);
- в контейнере: `AUTH_BASE_URL` или `VITE_AUTH_BASE_URL` записываются в `/config.js`
  (`frontend/docker-entrypoint.sh`), читаются из `window.__APP_CONFIG__`.

По умолчанию в проде `AUTH_BASE_URL` равен `/api/ums`. UI ожидает, что:
- `/api/ums` и `/api/twitter` доступны на том же домене;
- для локальной работы нужен reverse proxy (Ingress/NGINX) либо ручная настройка.

## Архитектура и ключевые файлы
- `src/App.tsx` - маршруты и route guards.
- `src/providers/AuthProvider.tsx` - хранение сессии, роли и методы доступа.
- `src/utils/authStorage.ts` - сохранение JWT-сессии в storage.
- `src/hooks/useAuthFetch.ts` - централизованная обработка 401.
- `src/services/auth.ts` - запросы к `/auth/login`.
- `src/config.ts` - загрузка базового URL UMS.
- `src/pages/*` - основные экраны (логин, консоль, подписки, админ-панель).

## Работа с JWT
### Получение токена
- Email/пароль: `LoginPage` вызывает `POST /auth/login` через `services/auth.ts`.
- GitHub OAuth: кнопка ведёт на `GET /oauth2/authorization/github` (UMS),
  после успешного входа UMS редиректит на `/login?auth=<base64url(AuthResponse)>`.

### Применение OAuth-сессии
- В `main.tsx` параметр `auth` декодируется (base64url),
  парсится в `AuthSession` и сохраняется.
- После применения параметр `auth` удаляется из URL.

### Хранение сессии
- `AuthSession`: `{ token, expiresAt, user }`.
- `rememberMe=true` -> `localStorage`, иначе `sessionStorage`.
- `expiresAt` хранится в секундах Unix time;
  просроченная или повреждённая сессия очищается при загрузке.

### Использование токена в запросах
- Компоненты добавляют `Authorization: Bearer <token>` при вызовах
  `/api/ums` и `/api/twitter`.
- `useAuthFetch` ловит 401, выполняет logout и редиректит на `/login`
  с сообщением о недействительной сессии.

## Роли и доступы
Роли: `ADMIN`, `SUBSCRIBER`, `PRODUCER` (см. `src/constants/roles.ts`).

### Маршрутизация
- Все основные маршруты защищены `RequireAuth`.
- `/admin` дополнительно защищён `RequireAdmin`, при отказе — редирект на `/forbidden`.

### Доступ к разделам UI
- Навигация в `AppShell` показывает пункты в зависимости от ролей:
  - SUBSCRIBER: подписки и лента.
  - PRODUCER: подписчики.
  - ADMIN: админ-панель.
- На страницах используются `canAccess(...)` и `hasRole(...)`:
  - подписки/лента доступны только SUBSCRIBER;
  - публикация сообщений и просмотр подписчиков — только PRODUCER;
  - управление пользователями и ролями — только ADMIN.

### Важно
UI скрывает недоступные действия, но окончательная проверка ролей
выполняется на стороне UMS и Twitter API.

## Основные пользовательские потоки
- Вход: логин/пароль или OAuth -> сохранение JWT -> редирект
  на `/admin` (если ADMIN) или `/console`.
- Работа с лентой: токен добавляется в запросы, данные показываются
  в зависимости от роли.
- Сессия истекла: API возвращает 401, приложение разлогинивает пользователя.

## Продакшн
Сборка попадает в `dist/`. Dockerfile собирает приложение и отдаёт его через Nginx.
