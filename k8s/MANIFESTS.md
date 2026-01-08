# Пояснения к манифестам Bird

Этот файл кратко описывает, что делает каждый манифест в папке `k8s/` и зачем он нужен.

## namespace.yaml
Создаёт namespace `apps`, в котором размещаются все компоненты приложения. Метка `app.kubernetes.io/part-of: bird` помогает группировать ресурсы.

## secrets.yaml
Содержит три `Secret`:
- `mysql-ums-secret`: параметры доступа к базе UMS (root-пароль, база, пользователь).
- `mysql-twitter-secret`: параметры доступа к базе Twitter (root-пароль, база).
- `ums-auth-secret`: OAuth-настройки GitHub для UMS.

Значения заданы через `stringData` для читаемости. Перед запуском в проде замените все пароли и OAuth-ключи.

## mysql-ums.yaml
Поднимает MySQL для сервиса UMS:
- `Service` типа `ClusterIP` открывает порт 3306 внутри кластера.
- `StatefulSet` хранит данные на PVC (`/var/lib/mysql`) и использует секреты из `mysql-ums-secret`.
- `storageClassName: standard` ожидает наличие storage class по умолчанию.

## mysql-twitter.yaml
Поднимает MySQL для сервиса Twitter:
- `Service` типа `ClusterIP` открывает порт 3306 внутри кластера.
- `StatefulSet` с PVC для данных, пароли берутся из `mysql-twitter-secret`.

## ums.yaml
Поднимает сервис авторизации UMS:
- `Service` на порту 9000 для внутренних обращений.
- `Deployment` с init-контейнером, который ждёт готовности MySQL.
- Переменные окружения задают URL БД и OAuth GitHub из `ums-auth-secret`.

## twitter.yaml
Поднимает сервис сообщений:
- `Service` на порту 9001 для внутренних обращений.
- `Deployment` с init-контейнером, который ждёт готовности MySQL.
- Переменные окружения указывают на MySQL и на UMS (host/port).

## frontend.yaml
Поднимает клиентское приложение:
- `Service` на порту 80 для отдачи статики.
- `Deployment` с образом фронтенда.
- `VITE_AUTH_BASE_URL` настроен на `/api/ums`, чтобы фронт ходил в UMS через ingress.

## ingress.yaml
Публикует приложение через NGINX Ingress на хосте `app.local`:
- Ingress `apps-frontend` проксирует `/` на `frontend:80`.
- Ingress `apps-apis` проксирует `/api/ums` и `/api/twitter` на соответствующие сервисы.
  Включён rewrite `/api/<service>/...` -> `/...` через `rewrite-target: /$2`.

## ingress-nginx-service-lb.yaml
Создаёт `Service` типа `LoadBalancer` для `ingress-nginx-controller`.
Нужен в окружениях, где ingress-контроллер развёрнут, но не имеет внешнего адреса.

## networkpolicies.yaml
Набор `NetworkPolicy`, который ограничивает сетевой доступ:
- `default-deny-all` запрещает входящий/исходящий трафик по умолчанию.
- `allow-dns-egress` разрешает DNS-запросы в kube-dns.
- `allow-ingress-to-frontend-from-ingress-nginx` разрешает вход на фронтенд только от ingress.
- `allow-frontend-egress-to-apis` разрешает фронту ходить к UMS и Twitter.
- `allow-ums-egress-to-github` разрешает UMS выход в интернет на 443 для GitHub OAuth.
- `ums-ingress-egress` и `twitter-ingress-egress` ограничивают доступ к сервисам.
- `mysql-ums-ingress-only-from-ums` и `mysql-twitter-ingress-only-from-twitter` закрывают БД от других подов.

Если в вашем кластере DNS размечен не как `k8s-app: kube-dns`, поменяйте селектор в `allow-dns-egress`.
