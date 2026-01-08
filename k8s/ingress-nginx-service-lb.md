# ingress-nginx-service-lb.yaml — внешний доступ к Ingress

## Назначение
Создаёт `Service` типа `LoadBalancer` для `ingress-nginx-controller`.
Нужен в кластерах, где ingress‑контроллер не имеет внешнего адреса.

## Состав ресурсов
- `Service ingress-nginx-controller` (namespace `ingress-nginx`)

## Что и зачем указано
- `type: LoadBalancer` — просит у провайдера внешний IP.
- `selector` — выбирает поды ingress‑контроллера.
- `ports` — публикуются 80 (HTTP) и 443 (HTTPS).

## Когда применять
- В локальных кластерах (kind/minikube) обычно **не нужен** —
  используются встроенные механизмы ingress.
- В облаке может понадобиться для получения внешнего IP.

## Как проверить
```
kubectl get svc -n ingress-nginx ingress-nginx-controller
```
