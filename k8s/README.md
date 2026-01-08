# Запуск в Kubernetes

## Требования
- `kubectl`, настроенный на кластер
- Установленный NGINX Ingress Controller (ingressClassName: `nginx`)
- StorageClass по умолчанию (или укажите `storageClassName` в StatefulSet для MySQL)
- CNI с поддержкой NetworkPolicy (нужно для `networkpolicies.yaml`)

## Сборка образов
Соберите образы из корня репозитория (детали в `DOCKER-BUILD.md`):
```shell
docker build -t ums:2.0 ums
docker build -t twitter:2.0 twitter
docker build -t frontend:2.0 frontend
```

Если кластер локальный, загрузите образы:
```shell
# kind
kind load docker-image ums:2.0 twitter:2.0 frontend:2.0

# minikube
minikube image load ums:2.0
minikube image load twitter:2.0
minikube image load frontend:2.0
```

Для удалённого кластера отправьте образы в реестр и обновите теги в манифестах.

## Деплой
1) Обновите `k8s/secrets.yaml` и задайте GitHub OAuth учётные данные.
   `GITHUB_REDIRECT_URI` должен совпадать с callback GitHub App.

2) Для Minikube включите ingress:
```shell
minikube addons enable ingress
```

3) Примените манифесты:
```shell
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/
```

Если вы используете Minikube, получите внешний адрес ingress:
```shell
minikube tunnel
kubectl get svc -n ingress-nginx ingress-nginx-controller
```

Добавьте запись в `hosts`: `<EXTERNAL-IP> app.local`.

## Проверка
```shell
kubectl get pods -n apps
kubectl rollout status -n apps deploy/ums
kubectl rollout status -n apps deploy/twitter
kubectl rollout status -n apps deploy/frontend
kubectl rollout status -n apps statefulset/mysql-ums
kubectl rollout status -n apps statefulset/mysql-twitter
```

## Доступ
Ingress использует хост `app.local`. Откройте:
- http://app.local/
- http://app.local/api/ums/...
- http://app.local/api/twitter/...

### Minikube: ingress как NodePort
Ingress аддон Minikube публикует контроллер как `NodePort`, поэтому используйте NodePort в URL:
```shell
minikube addons enable ingress
kubectl get svc -n ingress-nginx ingress-nginx-controller -o wide
# http://app.local:<nodePort>/
```

## Локальный DNS (app.local)
Сопоставьте `app.local` с адресом ingress:
```shell
# minikube
minikube ip

# kind (ingress на хосте)
# используйте 127.0.0.1, если ingress слушает 80/443 на хосте
```

Добавьте запись в `hosts`:
- Windows: `C:\Windows\System32\drivers\etc\hosts`
- macOS/Linux: `/etc/hosts`

Строка для добавления:
```
<ingress-ip> app.local
```

## Auth API
UMS выдаёт JWT:
- POST http://app.local/api/ums/auth/register
- POST http://app.local/api/ums/auth/login
- POST http://app.local/api/ums/auth/rotate-secret
- POST http://app.local/api/ums/auth/introspect
- POST http://app.local/api/ums/auth/rotate-secret/{user-id}

Для защищённых запросов используйте `Authorization: Bearer <token>`.

GitHub OAuth стартует по адресу:
- http://app.local/api/ums/oauth2/authorization/github

Если DNS в кластере размечен не как `k8s-app: kube-dns`, поправьте селектор в
`k8s/networkpolicies.yaml`.
