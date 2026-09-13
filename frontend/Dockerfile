# ==========================================
# Stage 1: Build React/Vite Bundle
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Tận dụng cache của Docker cho node_modules
COPY package*.json ./
RUN npm ci --prefer-offline || npm install

# Sao chép toàn bộ source code và build
COPY . .
RUN npm run build

# ==========================================
# Stage 2: Serve với Nginx Alpine
# ==========================================
FROM nginx:1.27-alpine

LABEL maintainer="routine-dev"
LABEL description="Routine Fashion Frontend Web Service"

# Cài đặt múi giờ Việt Nam
RUN apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/Asia/Ho_Chi_Minh /etc/localtime && \
    echo "Asia/Ho_Chi_Minh" > /etc/timezone

# Thay thế file cấu hình default của Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Sao chép các file static HTML/JS/CSS đã build từ Stage 1
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
