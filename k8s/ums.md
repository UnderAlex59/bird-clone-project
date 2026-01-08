# ums.yaml — сервис авторизации UMS

## Назначение
Разворачивает UMS (User Management Service), который отвечает за регистрацию,
логин, выдачу JWT и GitHub OAuth.

## Состав ресурсов
- `Service ums` (ClusterIP)
- `Deployment ums`

## Что и зачем указано
### Service
- `port: 9000` — порт приложения UMS.
- `selector.app: ums` — связывает Service с подами Deployment.

### Deployment
- `replicas: 1` — один экземпляр сервиса.
- `initContainers.wait-for-mysql` — ждёт доступности MySQL перед стартом приложения.
  Это снижает риск падения при старте из-за недоступной БД.
- `image: ums:2.0` — образ приложения.
- `env`:
  - `SPRING_DATASOURCE_URL` — JDBC‑URL к `mysql-ums`.
  - `SPRING_DATASOURCE_USERNAME/PASSWORD` — из `mysql-ums-secret`.
  - `GITHUB_CLIENT_ID/SECRET/REDIRECT_URI` — из `ums-auth-secret`.
  - `SERVER_PORT` — порт приложения.

## Что менять
- `image` — новый тег при деплое обновлённой версии.
- `SPRING_DATASOURCE_URL` — если меняется имя сервиса БД или база.
- OAuth‑переменные — при смене GitHub App.

## Как проверить
```
kubectl get svc -n apps ums
kubectl rollout status -n apps deploy/ums
kubectl logs -n apps deploy/ums
```
