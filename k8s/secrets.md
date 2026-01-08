# secrets.yaml — секреты БД и GitHub OAuth

## Назначение
Хранит чувствительные данные для сервисов: пароли MySQL и OAuth‑ключи GitHub.
Манифест кладёт секреты в namespace `apps`.

## Состав ресурсов
- `Secret mysql-ums-secret`
- `Secret mysql-twitter-secret`
- `Secret ums-auth-secret`

## Что и зачем указано
### `mysql-ums-secret`
- `MYSQL_ROOT_PASSWORD`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD` —
  параметры подключения к MySQL для UMS.

### `mysql-twitter-secret`
- `MYSQL_ROOT_PASSWORD`, `MYSQL_DATABASE` —
  параметры подключения к MySQL для Twitter.

### `ums-auth-secret`
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_REDIRECT_URI` —
  настройки GitHub OAuth, используемые UMS.

### `stringData`
Используется для удобства ввода текстовых значений. Kubernetes сам преобразует их в base64.

## Что менять
- **Обязательно** заменить все пароли и OAuth‑ключи на свои.
- `GITHUB_REDIRECT_URI` должен совпадать с настройками GitHub App.

## Как проверить
```
kubectl get secret -n apps
kubectl describe secret -n apps ums-auth-secret
```
