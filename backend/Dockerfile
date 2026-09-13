# ==========================================
# Stage 1: Build JAR package
# ==========================================
FROM maven:3.9.9-eclipse-temurin-17-alpine AS builder

WORKDIR /build

# Tận dụng Docker layer caching cho Maven dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B || true

# Copy mã nguồn và đóng gói JAR (bỏ qua unit tests khi build image)
COPY src ./src
RUN mvn clean package -DskipTests -B

# ==========================================
# Stage 2: Runtime Image (Lightweight JRE)
# ==========================================
FROM eclipse-temurin:17-jre-alpine

LABEL maintainer="routine-dev"
LABEL description="Routine Fashion E-Commerce Backend Service"

# Cài đặt múi giờ Việt Nam và curl phục vụ healthcheck
RUN apk add --no-cache tzdata curl && \
    cp /usr/share/zoneinfo/Asia/Ho_Chi_Minh /etc/localtime && \
    echo "Asia/Ho_Chi_Minh" > /etc/timezone

WORKDIR /app

# Tạo user không có đặc quyền root để tăng tính bảo mật
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Sao chép file JAR đã đóng gói từ Stage 1
COPY --from=builder /build/target/routine-backend-*.jar app.jar
RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 8080

# Cấu hình JVM tối ưu cho môi trường container
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
