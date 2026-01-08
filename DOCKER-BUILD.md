# Сборка Docker-образов
Гайд описывает сборку Docker-образов всех сервисов из корня репозитория.

## Требования
- Docker

## Сборка образов
Из корня репозитория:
```shell
docker build -t ums:2.0 ums
docker build -t twitter:2.0 twitter
docker build -t frontend:2.0 frontend
```

## Примечания
- При смене тега обновите манифесты в `k8s/`.
- Dockerfile находятся в `ums/`, `twitter/` и `frontend/`.
