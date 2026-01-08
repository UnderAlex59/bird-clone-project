# Сетевое взаимодействие сервисов в Kubernetes

Документ описывает, как сервисы Bird общаются друг с другом внутри кластера и какие правила это разрешают.

## Контуры и namespace
- Все сервисы приложения работают в namespace `apps`.
- Ingress-контроллер NGINX находится в namespace `ingress-nginx`.
- Сетевые политики в `k8s/networkpolicies.yaml` включают модель "по умолчанию всё запрещено".

## Схема потоков (упрощённо)
```
Пользователь
  |
  v
Ingress (app.local)
  |-- /            -> Service frontend:80 -> Pod frontend
  |-- /api/ums/... -> Service ums:9000     -> Pod ums
  |-- /api/twitter -> Service twitter:9001 -> Pod twitter

Pod twitter -> Service ums:9000            (проверка токенов/ролей)
Pod ums     -> Service mysql-ums:3306      (БД UMS)
Pod twitter -> Service mysql-twitter:3306  (БД Twitter)
Pod ums     -> GitHub:443                  (OAuth)
```

## Имена сервисов и порты
- `frontend` (порт 80)
- `ums` (порт 9000)
- `twitter` (порт 9001)
- `mysql-ums` (порт 3306)
- `mysql-twitter` (порт 3306)

Kubernetes DNS позволяет обращаться по имени сервиса: например `http://ums:9000` внутри namespace `apps`.

## Ingress (наружный трафик)
Файл `k8s/ingress.yaml` публикует домен `app.local`:
- `/` -> `frontend:80`
- `/api/ums/*` -> `ums:9000` (с переписыванием пути)
- `/api/twitter/*` -> `twitter:9001` (с переписыванием пути)

Все API-запросы из браузера идут через ingress на соответствующие сервисы.

## NetworkPolicy: базовые правила
`default-deny-all` блокирует входящий и исходящий трафик для всех подов `apps` без явных разрешений.

### DNS
`allow-dns-egress` разрешает всем подам DNS-запросы к kube-dns, иначе сервисные имена не будут резолвиться.

### Входящий трафик
- `allow-ingress-to-frontend-from-ingress-nginx`:
  разрешает доступ к `frontend` только из namespace `ingress-nginx`.
- `ums-ingress-egress`:
  разрешает вход к `ums` из `frontend`, `twitter` и `ingress-nginx`.
- `twitter-ingress-egress`:
  разрешает вход к `twitter` из `frontend` и `ingress-nginx`.
- `mysql-ums-ingress-only-from-ums`:
  разрешает вход к `mysql-ums` только из `ums`.
- `mysql-twitter-ingress-only-from-twitter`:
  разрешает вход к `mysql-twitter` только из `twitter`.

### Исходящий трафик
- `allow-frontend-egress-to-apis`:
  разрешает подам `frontend` выход к `ums:9000` и `twitter:9001`.
  Это не обязательно для SPA (браузер ходит в API напрямую через ingress),
  но политика оставлена как безопасное допущение.
- `ums-ingress-egress`:
  разрешает `ums` выход к `mysql-ums:3306`.
- `twitter-ingress-egress`:
  разрешает `twitter` выход к `ums:9000` и `mysql-twitter:3306`.
- `allow-ums-egress-to-github`:
  разрешает `ums` выход в интернет на `443` для GitHub OAuth.

## Важные замечания
- Если в кластере DNS размечен не как `k8s-app: kube-dns`, нужно поменять селектор
  в `allow-dns-egress` (см. `k8s/README.md`).
- При добавлении новых сервисов нужно обновлять `networkpolicies.yaml`, иначе трафик будет блокироваться.
- Внешний IP ingress-контроллера может требовать отдельного `Service` типа `LoadBalancer`
  (см. `k8s/ingress-nginx-service-lb.yaml`).
