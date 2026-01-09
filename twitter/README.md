# Twitter (сервис сообщений)

Twitter отвечает за хранение сообщений, подписки между пользователями и выдачу
лент. Сервис использует UMS для проверки токенов и получения ролей пользователя.

## Используемые технологии
- Java 21, Spring Boot 3.5.7
- Spring WebFlux + Reactor (Mono)
- Spring Security Resource Server
- JWT-интроспекция через UMS (кастомный ReactiveJwtDecoder)
- JDBC (JdbcTemplate) + MySQL 8
- Flyway миграции
- Gradle, Docker multi-stage build, Spring Actuator

## Архитектура и компоненты
- Контроллеры:
  - MessageController - работа с сообщениями и выборками
  - SubscriptionController - управление подписками
- Сервисы:
  - MessagesService - бизнес-правила для сообщений
  - SubscriptionsService - бизнес-правила для подписок
  - UMSConnector - запросы к UMS /users/user/{id} с Authorization
- Аутентификация:
  - RemoteIntrospectionJwtDecoder - валидация JWT через UMS интроспекцию
  - UmsIntrospectionClient - вызов /auth/introspect
  - SecurityConfig - настройка resource server и ролей

## Модель данных и миграции
- messages: id, producer_id, content (varchar(140)), created
- producers: producer_id
- subscribers: subscriber_id
- subscriptions: связь subscriber_id <-> producer_id
- Flyway: V1__init.sql

## Проверка токена и ролей
- Все эндпоинты требуют `Authorization: Bearer <token>`, кроме `/actuator/**`.
- RemoteIntrospectionJwtDecoder:
  - парсит JWT локально;
  - вызывает UMS `POST /auth/introspect`, требуется `active = true`;
  - проверяет issuer на соответствие `app.jwt.issuer`;
  - сверяет `sub` из интроспекции и JWT;
  - добавляет роли в claims и мапит их как `ROLE_<ROLE>`.
- Дополнительно сервис запрашивает UMS `/users/user/{id}` для проверки роли
  конкретного пользователя (PRODUCER/SUBSCRIBER) перед выполнением операции.

## Логика работы (основные потоки)
### Создание сообщения
1. `POST /messages/message` с телом Message и Authorization.
2. MessagesService получает пользователя через UMS `/users/user/{authorId}`.
3. Сообщение создаётся только если есть роль PRODUCER.
4. Репозиторий сохраняет сообщение и создаёт запись в producers при необходимости.

### Чтение сообщений
- `GET /messages/message/{id}` - одно сообщение по id.
- `GET /messages/producer/{producerId}` - все сообщения продьюсера.
- `GET /messages/subscriber/{subscriberId}`:
  - проверка роли SUBSCRIBER через UMS;
  - выборка сообщений от продьюсеров, на которых подписан пользователь.

### Подписки
- `GET /subscriptions/subscriber/{subscriberId}`:
  - проверка роли SUBSCRIBER через UMS;
  - выдача списка продьюсеров, на которых подписан пользователь.
- `GET /subscriptions/producer/{producerId}`:
  - проверка роли PRODUCER через UMS;
  - выдача списка подписчиков продьюсера.
- `POST /subscriptions`:
  - проверка роли SUBSCRIBER через UMS;
  - создаёт subscriber/producer при необходимости;
  - вставляет подписки.
- `PUT /subscriptions`:
  - пересоздаёт подписки (delete + insert).
- `DELETE /subscriptions/subscriber/{subscriberId}`:
  - удаляет все подписки пользователя.

## Эндпоинты (кратко)
- GET `/messages/message/{message-id}`
- GET `/messages/producer/{producer-id}`
- GET `/messages/subscriber/{subscriber-id}`
- POST `/messages/message`
- DELETE `/messages/message/{message-id}`
- GET `/subscriptions/subscriber/{subscriber-id}`
- GET `/subscriptions/producer/{producer-id}`
- POST `/subscriptions`
- PUT `/subscriptions`
- DELETE `/subscriptions/subscriber/{subscriber-id}`

## Конфигурация
- `server.port`: 9001
- `spring.datasource.url`: `jdbc:mysql://0.0.0.0:3308/twitter`
- `ums.host`, `ums.port`, `ums.paths.user`, `ums.paths.introspect`
- `app.jwt.issuer`: должен совпадать с issuer в UMS

## Docker и сборка
- Dockerfile использует multi-stage build с Gradle и JRE 21.
- Итоговый артефакт: `twitter.jar`.

## Связанные документы
- `docs/authentication.md`
- `k8s/twitter.md`
- `k8s/NETWORK.md`
