# API авторизации и аутентификации

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

## Логин
`POST /auth/login`

Тело запроса:
```json
{
  "email": "jane@example.com",
  "password": "password"
}
```

Ответ аналогичен регистрации (JWT + данные пользователя).

## Ротация ключа пользователя
`POST /auth/rotate-secret`  
Требует `Authorization: Bearer <token>`.

Ответ: новый JWT, подписанный новым `secret_key`.

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
Старт авторизации:
`GET /oauth2/authorization/github`

После успешного логина UMS отвечает JSON с JWT (через success handler).

## Использование JWT в API
Все защищенные эндпойнты UMS и Twitter требуют:
```
Authorization: Bearer <token>
```

Пример:
```
GET /users
Authorization: Bearer <token>
```
