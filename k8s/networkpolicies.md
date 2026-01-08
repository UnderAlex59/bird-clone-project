# networkpolicies.yaml — сетевые политики

## Назначение
Ограничивает сетевые взаимодействия между подами в namespace `apps`.
Модель безопасности — **default deny**, доступ разрешается явно.

## Состав ресурсов и логика
### 1) `default-deny-all`
Запрещает весь входящий и исходящий трафик по умолчанию.

### 2) `allow-dns-egress`
Разрешает всем подам выход к DNS (`kube-dns`) на порты 53/UDP и 53/TCP.
Без этого имена сервисов не будут резолвиться.

### 3) `allow-ingress-to-frontend-from-ingress-nginx`
Разрешает вход на фронтенд только из namespace `ingress-nginx`.

### 4) `allow-frontend-egress-to-apis`
Разрешает фронту ходить к `ums:9000` и `twitter:9001`.
Это безопасное допущение; SPA обычно ходит в API из браузера через ingress.

### 5) `allow-ums-egress-to-github`
Разрешает UMS выход в интернет на 443 для GitHub OAuth.

### 6) `ums-ingress-egress`
UMS:
- Вход: от `frontend`, `twitter` и `ingress-nginx` на порт 9000.
- Выход: к `mysql-ums` на порт 3306.

### 7) `twitter-ingress-egress`
Twitter:
- Вход: от `frontend` и `ingress-nginx` на порт 9001.
- Выход: к `ums` (9000) и `mysql-twitter` (3306).

### 8) `mysql-ums-ingress-only-from-ums`
MySQL UMS принимает входящие соединения только от UMS (порт 3306).

### 9) `mysql-twitter-ingress-only-from-twitter`
MySQL Twitter принимает входящие соединения только от Twitter (порт 3306).

## Что менять
- Селектор DNS в `allow-dns-egress`, если в кластере другие метки kube-dns.
- Порты и селекторы, если добавляются новые сервисы или меняются имена.

## Как проверить
```
kubectl get networkpolicy -n apps
kubectl describe networkpolicy -n apps default-deny-all
```
