# frontend.yaml — клиентское приложение

## Назначение
Разворачивает веб‑интерфейс (React/Vite) и публикует его внутри кластера.

## Состав ресурсов
- `Service frontend` (ClusterIP)
- `Deployment frontend`

## Что и зачем указано
### Service
- `port: 80` — порт отдачи статических файлов.
- `selector.app: frontend` — связывает Service с подами Deployment.

### Deployment
- `replicas: 1` — один экземпляр фронта.
- `image: frontend:2.0` — образ фронтенда.
- `VITE_AUTH_BASE_URL: "/api/ums"` —
  базовый адрес для запросов авторизации через ingress.

## Что менять
- `image` — новый тег при деплое обновлённой версии.
- `VITE_AUTH_BASE_URL` — если меняется путь к UMS или схема проксирования.

## Как проверить
```
kubectl get svc -n apps frontend
kubectl rollout status -n apps deploy/frontend
kubectl logs -n apps deploy/frontend
```
