# UMS (User Management Service)

UMS отвечает за регистрацию и логин пользователей, хранение ролей, выпуск JWT и интеграцию с GitHub OAuth.
Сервис выступает источником истины для аутентификации и интроспекции токенов в проекте.

## Используемые технологии
- Java 21, Spring Boot 3.5.7.
- Spring WebFlux + Reactor (Mono).
- Spring Security: OAuth2 Client и Resource Server.
- JWT на базе Nimbus JOSE (HS256), кастомный ReactiveJwtDecoder.
- JDBC (JdbcTemplate) + MySQL 8.
- Flyway миграции (`V1__init.sql`, `V2__auth.sql`).
- BCrypt для паролей.
- Gradle, Docker multi-stage build, Spring Actuator.

## Архитектура и ключевые компоненты
- Контроллеры:
  - `AuthController` - регистрация, логин, интроспекция, ротация секрета.
  - `UserController` - CRUD пользователей, управление ролями.
  - `RolesController` - получение справочника ролей.
- Сервисная логика:
  - `AuthService` - основной оркестратор регистрации, логина, OAuth и интроспекции.
  - `JwtService` - сборка и подпись JWT.
  - `UserSecretJwtDecoder` - верификация токена по secret_key пользователя.
- DAO слой:
  - `JdbcUmsRepository` реализует `UmsRepository` и `AuthRepository`.
  - Доступ к MySQL через `JdbcTemplate`.

## Данные и миграции
- `users` - пользователь, пароль, `secret_key`, дата создания, `last_visit_id`.
- `roles` - справочник ролей (ADMIN, SUBSCRIBER, PRODUCER).
- `users_has_roles` - связь многие-ко-многим пользователь-роль.
- `last_visit` - история входов (используется в выборках).
- `user_identities` - связи OAuth-провайдера (GitHub).
- Flyway:
  - `V1__init.sql` создаёт базовые таблицы и сиды ролей/пользователей.
  - `V2__auth.sql` добавляет `user_identities`.

## JWT и безопасность
- Алгоритм подписи: HS256.
- Для каждого пользователя хранится свой `secret_key` (64 hex символа).
- Claims: `sub`, `email`, `roles`, `iss`, `iat`, `exp`.
- Валидация: `UserSecretJwtDecoder` загружает пользователя по `sub`, проверяет подпись
  по его `secret_key`, затем проверяет issuer и срок жизни.

## Логика работы (основные потоки)
### Регистрация
1. `POST /auth/register`.
2. Проверка обязательных полей и уникальности email.
3. Создание пользователя, роли по умолчанию `SUBSCRIBER`.
4. Генерация `secret_key` (если отсутствует).
5. Выдача JWT.

### Логин
1. `POST /auth/login`.
2. Поиск пользователя по email.
3. Проверка пароля:
   - BCrypt - обычное сравнение.
   - Открытый текст (legacy) - допускается, затем пароль обновляется до BCrypt.
4. Генерация `secret_key` (если отсутствует).
5. Выдача JWT.

### GitHub OAuth
1. `GET /oauth2/authorization/github`.
2. `GithubAuthSuccessHandler` вызывает `AuthService.handleGithubLogin`.
3. UMS:
   - извлекает GitHub `id`;
   - определяет email (из профиля или `login@users.noreply.github.com`);
   - ищет связь в `user_identities`;
   - создаёт пользователя, если связи нет;
   - сохраняет связь `user_identities`.
4. Формирует `AuthResponse` и редиректит на
   `/login?auth=<base64url(AuthResponse)>`.

### Интроспекция токена
1. `POST /auth/introspect` с `{ "token": "<jwt>" }`.
2. `UserSecretJwtDecoder` проверяет подпись и срок действия.
3. Ответ: `active`, `sub`, `roles`.

### Ротация секрета
- Пользователь: `POST /auth/rotate-secret`.
- Админ: `POST /auth/rotate-secret/{user-id}` (роль ADMIN проверяется по claim `roles`).
- После ротации все ранее выданные токены становятся невалидными.

### Управление пользователями и ролями
- `GET /users` - список пользователей.
- `GET /users/user/{user-id}` - данные пользователя.
- `POST /users/user` - создание пользователя (пароль кодируется в BCrypt).
- `DELETE /users/user/{user-id}` - удаление пользователя.
- `PUT /users/user/{user-id}/roles` - обновление ролей пользователя.
- `GET /roles` - справочник ролей.

## Публичные и защищённые эндпоинты
Публичные:
- `/auth/register`, `/auth/login`, `/auth/introspect`
- `/oauth2/**`, `/login/**`, `/actuator/**`

Все остальные эндпоинты требуют `Authorization: Bearer <token>`.

## Конфигурация
- Порт: `server.port` (по умолчанию 9000).
- MySQL: `spring.datasource.url/username/password`.
  По умолчанию `jdbc:mysql://0.0.0.0:3306/ums`, `user/qwerty123`.
- JWT: `app.jwt.issuer`, `app.jwt.ttl-seconds`.
- GitHub OAuth: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_REDIRECT_URI`.

## Связанные документы
- `docs/authentication.md` - полный разбор auth-флоу.
- `docs/auth-api.md` - примеры запросов и ответов.
- `docs/auth-overview.md` - обзор и краткие схемы.
