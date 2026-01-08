# twitter.yaml — сервис сообщений (Twitter)

## Назначение
Разворачивает сервис сообщений. Он использует MySQL и обращается к UMS
для проверки токенов через интроспекцию.

## Состав ресурсов
- `Service twitter` (ClusterIP)
- `Deployment twitter`

## Что и зачем указано
### Service
- `port: 9001` — порт приложения Twitter.
- `selector.app: twitter` — связывает Service с подами Deployment.

### Deployment
- `replicas: 1` — один экземпляр сервиса.
- `initContainers.wait-for-mysql` — ждёт доступности MySQL.
- `image: twitter:2.0` — образ приложения.
- `env`:
  - `SPRING_DATASOURCE_URL` — JDBC‑URL к `mysql-twitter`.
  - `SPRING_DATASOURCE_USERNAME/PASSWORD` — учётные данные БД (root‑пароль из секрета).
  - `UMS_HOST`/`UMS_PORT` — адрес UMS для интроспекции.
  - `SERVER_PORT` — порт приложения.

## Что менять
- `image` — новый тег при деплое обновлённой версии.
- `UMS_HOST`/`UMS_PORT` — если меняется адрес UMS.
- `SPRING_DATASOURCE_URL` — если меняется имя сервиса БД или база.

## Как проверить
```
kubectl get svc -n apps twitter
kubectl rollout status -n apps deploy/twitter
kubectl logs -n apps deploy/twitter
```
