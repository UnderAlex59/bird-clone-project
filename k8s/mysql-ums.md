# mysql-ums.yaml — база данных для UMS

## Назначение
Разворачивает MySQL для сервиса UMS и обеспечивает постоянное хранение данных.

## Состав ресурсов
- `Service mysql-ums` (ClusterIP)
- `StatefulSet mysql-ums`

## Что и зачем указано
### Service
- `type: ClusterIP` — база доступна только внутри кластера.
- `port: 3306` — стандартный порт MySQL.
- `selector.app: mysql-ums` — связывает Service с подами StatefulSet.

### StatefulSet
- `serviceName: mysql-ums` — headless‑сервис для стабильных DNS‑имён.
- `replicas: 1` — один экземпляр базы.
- `image: mysql:8.0` — официальный образ MySQL.
- `env` — берёт пароли и имя базы из `mysql-ums-secret`.
- `volumeMounts` + `volumeClaimTemplates` —
  сохраняют данные на PVC (`/var/lib/mysql`).
- `storageClassName: standard` — ожидается StorageClass с именем `standard`.

## Что менять
- `storageClassName` — если в кластере другой StorageClass.
- `resources.requests.storage` — размер диска под БД.
- `image` — при необходимости использовать другую версию MySQL.

## Как проверить
```
kubectl get svc -n apps mysql-ums
kubectl get statefulset -n apps mysql-ums
kubectl get pvc -n apps
```
