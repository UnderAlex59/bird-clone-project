# mysql-twitter.yaml — база данных для сервиса Twitter

## Назначение
Разворачивает MySQL для сервиса Twitter и сохраняет данные на постоянном томе.

## Состав ресурсов
- `Service mysql-twitter` (ClusterIP)
- `StatefulSet mysql-twitter`

## Что и зачем указано
### Service
- `type: ClusterIP` — база доступна только внутри кластера.
- `port: 3306` — стандартный порт MySQL.
- `selector.app: mysql-twitter` — связывает Service с подами StatefulSet.

### StatefulSet
- `serviceName: mysql-twitter` — стабильные DNS‑имена для подов.
- `replicas: 1` — один экземпляр базы.
- `image: mysql:8.0` — официальный образ MySQL.
- `env` — пароли и имя базы из `mysql-twitter-secret`.
- `volumeMounts` + `volumeClaimTemplates` —
  сохраняют данные на PVC (`/var/lib/mysql`).
- `storageClassName: standard` — ожидается StorageClass с именем `standard`.

## Что менять
- `storageClassName` — если в кластере другой StorageClass.
- `resources.requests.storage` — размер диска под БД.
- `image` — версия MySQL при необходимости.

## Как проверить
```
kubectl get svc -n apps mysql-twitter
kubectl get statefulset -n apps mysql-twitter
kubectl get pvc -n apps
```
