# Bird — учебный Twitter на микросервисах
Проект — учебная версия Twitter (X) для курса Algonquin College CST8277 "Enterprise Application Programming". Цель — показать плюсы и минусы микросервисной архитектуры и пройти путь: дизайн, модель данных, реализация, безопасность.

## Состав
- UMS (Users/Auth) — порт 9000, БД MySQL на 3306
- Twitter (сообщения/подписки) — порт 9001, БД MySQL на 3308
- Frontend (React + Vite)

## Требования
- JDK 21 (`JAVA_HOME`)
- Docker
- Node.js 18+ (для фронтенда)
- Git

## Быстрый старт (локально)

### 1) Базы данных
Запустите MySQL контейнеры:
```shell
docker compose up -d
```
Если у вас старая версия Docker:
```shell
docker-compose up -d
```

Будут подняты две базы:
- `ums` (порт 3306, `user` / `qwerty123`)
- `twitter` (порт 3308, `root` / `passw`)

Flyway применит миграции автоматически при старте сервисов. SQL в `database/` оставлен для справки.

### 2) UMS
```shell
cd ums
./gradlew build
java -jar build/libs/ums.jar
```
Windows:
```shell
cd ums
gradlew.bat build
java -jar build\\libs\\ums.jar
```

### 3) Twitter
```shell
cd twitter
./gradlew build
java -jar build/libs/twitter.jar
```
Windows:
```shell
cd twitter
gradlew.bat build
java -jar build\\libs\\twitter.jar
```

### 4) Проверка
- UMS: http://localhost:9000
- Twitter: http://localhost:9001

Коллекции для Postman лежат в `requests/`.

## Auth (JWT + GitHub)
UMS выдаёт токены:
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/rotate-secret`
- `POST /auth/introspect`

Администратор может сбросить секрет пользователя:
- `POST /auth/rotate-secret/{user-id}`

Для защищённых запросов используйте `Authorization: Bearer <token>`.

GitHub OAuth стартует по `GET /oauth2/authorization/github`.
Нужны `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_REDIRECT_URI`.

## Фронтенд
```shell
cd frontend
npm install
VITE_AUTH_BASE_URL=http://localhost:9000 npm run dev
```

Примечания:
- UI ожидает, что `/api/ums` и `/api/twitter` доступны на том же хосте (reverse proxy/ingress).
- Для локальной разработки настройте proxy в Vite или запускайте фронтенд за Nginx/Ingress.
- В контейнере используется `AUTH_BASE_URL` или `VITE_AUTH_BASE_URL` (см. `frontend/docker-entrypoint.sh`).

## Docker и Kubernetes
- Сборка образов: `DOCKER-BUILD.md`
- Запуск в кластере: `k8s/README.md`

## Документация по auth
- `docs/auth-overview.md`
- `docs/auth-api.md`

## Вклад в проект
1. Сделайте форк репозитория.
2. Создайте ветку: `git checkout -b my-new-branch`.
3. Внесите изменения.
4. Закоммитьте: `git commit -m "Add new code"`.
5. Запушьте ветку в форк: `git push origin my-new-branch`.
6. Откройте Pull Request с описанием изменений.

## Лицензия
[BSD 2-Clause License](LICENSE).
