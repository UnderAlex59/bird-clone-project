# Аутентификация, авторизация и интроспекция (JWT + GitHub)

## Компоненты
- **UMS** — сервис пользователей и авторизации, выдаёт JWT и хранит `secret_key`.
- **Twitter** — ресурсный сервис, валидирует токены через `/auth/introspect`.
- **Frontend** — хранит JWT и отправляет `Authorization: Bearer <token>` в API.

## JWT
- Алгоритм: HS256.
- Для каждого пользователя хранится свой `secret_key` (64 hex-символа).
- Поля в токене: `sub` (userId), `email`, `roles`, `iss`, `iat`, `exp`.

## Хранение
- Таблица `users`: `password` (BCrypt), `secret_key`.
- Таблица `user_identities`: связи OAuth-провайдеров (GitHub).

## Потоки
### 1) Регистрация
1. `POST /auth/register`.
2. UMS создаёт пользователя и `secret_key`.
3. UMS выдаёт JWT.

### 2) Логин
1. `POST /auth/login`.
2. Проверка пароля (BCrypt).
3. UMS выдаёт JWT.

### 3) GitHub OAuth
1. `GET /oauth2/authorization/github`.
2. UMS обрабатывает callback, создаёт/связывает пользователя.
3. Редирект на `/login?auth=<base64(AuthResponse)>` (используется фронтендом).

### 4) Ротация секрета
1. Пользователь: `POST /auth/rotate-secret` с Bearer-токеном.
2. Администратор: `POST /auth/rotate-secret/{user-id}` с Bearer-токеном администратора.
3. UMS обновляет `secret_key` указанного пользователя.
4. Старые токены становятся невалидными.

### 5) Интроспекция
Twitter вызывает `POST /auth/introspect` в UMS. UMS проверяет подпись и срок жизни токена
и возвращает `active`, `sub`, `roles`.

## Конфигурация
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_REDIRECT_URI`
- `app.jwt.issuer`, `app.jwt.ttl-seconds`
