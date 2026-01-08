# Авторизация и регистрация в проекте Bird

Документ описывает полный цикл аутентификации/авторизации: локальные учётные данные,
JWT, GitHub OAuth, интроспекцию токенов и хранение сессий на фронтенде.

## Компоненты и роли
- **UMS** — сервис пользователей и авторизации. Выдаёт JWT, хранит `secret_key`.
- **Twitter** — ресурсный сервис. Валидирует JWT через интроспекцию в UMS.
- **Frontend** — хранит сессию и отправляет `Authorization: Bearer <token>`.

## JWT: какой используется
UMS выдаёт **JWT с подписью HS256**.

Ключ подписи:
- Для **каждого пользователя** хранится свой `secret_key` (`users.secret_key`).
- Значение генерируется как 64 hex-символа (в БД: `HEX(RANDOM_BYTES(32))`).
- При подписании используется `secret_key` как строка (байты UTF-8).

Набор claim'ов:
- `iss` — issuer (`app.jwt.issuer`, по умолчанию `ums-service`)
- `iat` — время выпуска
- `exp` — время истечения (`app.jwt.ttl-seconds`, по умолчанию 3600)
- `sub` — ID пользователя
- `email` — email пользователя
- `roles` — список ролей

Проверка токена:
- UMS валидирует подпись, issuer и срок жизни через `UserSecretJwtDecoder`.
- Twitter разбирает JWT, проверяет issuer и сверяет `sub` с интроспекцией UMS.

## Регистрация (email + пароль)
Endpoint: `POST /auth/register`

Логика (UMS):
1) Проверка обязательных полей (`name`, `email`, `password`).
2) Проверка уникальности email.
3) Создание пользователя в БД.
4) Генерация `secret_key` (если отсутствует).
5) Выдача JWT в ответе.

Роли:
- Если `roles` не переданы, назначается `SUBSCRIBER`.
- Роли сохраняются в БД и выдаются в claim `roles`.

## Логин (email + пароль)
Endpoint: `POST /auth/login`

Логика (UMS):
1) Поиск пользователя по email.
2) Проверка пароля.
   - Если пароль хранится в BCrypt — сравнение через `PasswordEncoder`.
   - Если пароль в открытом виде (старые записи) — разрешается логин
     и пароль тут же обновляется до BCrypt.
3) Генерация `secret_key` (если отсутствует).
4) Выдача JWT.

## GitHub OAuth
Старт потока:
`GET /oauth2/authorization/github`

Как работает:
1) Пользователь начинает OAuth‑логин из фронта.
2) GitHub возвращает пользователя в UMS.
3) `GithubAuthSuccessHandler` вызывает `AuthService.handleGithubLogin(...)`.
4) UMS:
   - Берёт GitHub `id`.
   - Определяет email:
     - `email` из профиля;
     - либо `login@users.noreply.github.com`;
     - либо случайный `UUID@users.noreply.github.com`.
   - Ищет связь `user_identities` (provider = `github`).
   - Если связь есть — выдаёт JWT для найденного пользователя.
   - Если связи нет:
     - создаёт пользователя (роль по умолчанию `SUBSCRIBER`);
     - создаёт запись в `user_identities`.
5) UMS формирует `AuthResponse` и редиректит на:
   `/login?auth=<base64url(AuthResponse)>`

На фронте:
- `main.tsx` читает параметр `auth`, декодирует Base64 URL и сохраняет сессию.
- Далее пользователь остаётся на `/login`, но уже с активной сессией.

## Интроспекция и авторизация в Twitter
Twitter **не проверяет подпись локально** — он вызывает UMS:

Endpoint: `POST /auth/introspect`
```json
{ "token": "<jwt>" }
```

UMS:
- Валидирует JWT через `UserSecretJwtDecoder`.
- Возвращает `active`, `sub` и `roles`.

Twitter:
- Если `active = false` — отклоняет запрос.
- Дополнительно сверяет `issuer` и `sub` с самим JWT.

## Ротация секрета (инвалидация токенов)
Endpoint для пользователя:
`POST /auth/rotate-secret`

Endpoint для администратора:
`POST /auth/rotate-secret/{user-id}`

Эффект:
- Генерируется новый `secret_key`.
- **Все ранее выданные токены становятся невалидными**, так как подпись
  больше не совпадает с актуальным `secret_key`.

На фронтенде:
- Любой ответ `401` приводит к logout и редиректу на `/login`
  с сообщением о недействительной сессии.

## Хранение сессии на фронте
Формат сессии: `AuthSession` (`token`, `expiresAt`, `user`).

Где хранится:
- `sessionStorage`, если пользователь не выбрал “запомнить”.
- `localStorage`, если выбрал “запомнить”.

При загрузке:
- Если `expiresAt` истёк — сессия очищается.

## Конфигурация и переменные
UMS (`application.yaml`):
- `app.jwt.issuer` — issuer JWT (по умолчанию `ums-service`)
- `app.jwt.ttl-seconds` — TTL в секундах (по умолчанию 3600)
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_REDIRECT_URI`

Twitter (`application.yaml`):
- `ums.host`, `ums.port`, `ums.paths.introspect`
- `app.jwt.issuer` — должен совпадать с UMS

Frontend:
- `VITE_AUTH_BASE_URL` или `AUTH_BASE_URL`
- В проде по умолчанию `/api/ums` (через ingress)

## Публичные и защищённые эндпоинты UMS
Разрешены без токена:
- `/auth/register`
- `/auth/login`
- `/auth/introspect`
- `/oauth2/**`
- `/login/**`
- `/actuator/**`

Все остальные эндпоинты требуют `Authorization: Bearer <token>`.
