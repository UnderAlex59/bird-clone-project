# Auth API (UMS)

## Регистрация
`POST /auth/register`

Тело запроса:
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "password",
  "roles": ["SUBSCRIBER", "PRODUCER"]
}
```

Ответ:
```json
{
  "code": "201",
  "message": "User registered",
  "data": {
    "token": "<jwt>",
    "expiresAt": 1700000000,
    "user": {
      "id": "uuid",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "roles": ["SUBSCRIBER"]
    }
  }
}
```

Если `roles` не переданы, будет назначен `SUBSCRIBER`.

## Логин
`POST /auth/login`

Тело запроса:
```json
{
  "email": "jane@example.com",
  "password": "password"
}
```

Ответ аналогичен регистрации (`code: "200"`, `message: "Login successful"`).

## Ротация секрета
`POST /auth/rotate-secret`

Заголовок:
```
Authorization: Bearer <token>
```

Ответ: как у регистрации/логина, но с новым JWT.

### Админ: ротация секрета пользователя
`POST /auth/rotate-secret/{user-id}`

Заголовок:
```
Authorization: Bearer <admin-token>
```

Ответ:
```json
{
  "code": "200",
  "message": "Secret rotated",
  "data": "uuid"
}
```

## Интроспекция токена
`POST /auth/introspect`

Тело запроса:
```json
{
  "token": "<jwt>"
}
```

Ответ:
```json
{
  "active": true,
  "sub": "uuid",
  "roles": ["SUBSCRIBER"]
}
```

## GitHub OAuth
Старт потока:
`GET /oauth2/authorization/github`

После успешного логина UMS делает редирект на:
```
/login?auth=<base64(AuthResponse)>
```

## Использование JWT
Для защищённых эндпоинтов UMS и Twitter:
```
Authorization: Bearer <token>
```

Пример:
```
GET /users
Authorization: Bearer <token>
```
