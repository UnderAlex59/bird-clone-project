# -------- build stage --------
FROM gradle:8.7-jdk21 AS build
WORKDIR /app
COPY . .
RUN gradle clean bootJar --no-daemon

# -------- runtime stage --------
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/build/libs/*.jar /app/app.jar

# Порт приложения
EXPOSE 9000

# Запуск приложения
ENTRYPOINT ["sh", "-c", "java -jar /app/app.jar --server.port=9000"]
