# ingress.yaml — входной трафик (NGINX Ingress)

## Назначение
Публикует фронтенд и API на домене `app.local` и проксирует запросы
во внутренние сервисы.

## Состав ресурсов
- `Ingress apps-frontend`
- `Ingress apps-apis`

## Что и зачем указано
### Ingress `apps-frontend`
- `host: app.local` — единый домен для приложения.
- `path: /` -> `service frontend:80` — отдача фронта.
- `nginx.ingress.kubernetes.io/ssl-redirect: "false"` —
  отключение принудительного редиректа на HTTPS.

### Ingress `apps-apis`
- `use-regex: "true"` и `rewrite-target: /$2` —
  убирает префикс `/api/ums` или `/api/twitter`.
- `/api/ums(/|$)(.*)` -> `service ums:9000`
- `/api/twitter(/|$)(.*)` -> `service twitter:9001`

## Что менять
- `host` — если используется другой домен.
- `ssl-redirect` — включить, если нужен HTTPS.
- `rewrite-target` — если меняется формат проксирования.

## Как проверить
```
kubectl get ingress -n apps
kubectl describe ingress -n apps apps-frontend
kubectl describe ingress -n apps apps-apis
```
