# 部署指南

本文件提供 RoboDog Simulation WebUI 的完整部署教學。

## 目錄

1. [開發環境設定](#開發環境設定)
2. [自訂 IP 與 Port 部署](#自訂-ip-與-port-部署)
3. [生產環境部署](#生產環境部署)
4. [Docker 部署](#docker-部署)
5. [常見問題](#常見問題)

---

## 開發環境設定

### 系統需求

- Node.js 18+ (建議 20 LTS)
- npm 9+ 或 yarn 1.22+
- 現代瀏覽器 (Chrome 90+, Firefox 88+, Safari 14+)

### 安裝步驟

```bash
# 1. 複製專案
git clone <repository-url>
cd simulation-webui

# 2. 安裝依賴
npm install

# 3. 複製環境設定
cp .env.example .env

# 4. 啟動開發伺服器
npm run dev
```

---

## 自訂 IP 與 Port 部署

### 情境說明

當需要：
- 在區域網路中讓其他裝置存取
- 使用特定 Port 避免衝突
- 連接遠端 MuJoCo 後端

### 步驟 1: 設定環境變數

編輯 `.env` 檔案：

```bash
# ============================================
# 前端伺服器設定
# ============================================

# 綁定位址
# - localhost: 僅本機存取
# - 0.0.0.0: 允許所有網路介面存取
VITE_HOST=0.0.0.0

# 開發伺服器 Port
VITE_PORT=3000

# 預覽伺服器 Port (npm run preview)
VITE_PREVIEW_PORT=4000

# ============================================
# MuJoCo 後端設定
# ============================================

# WebSocket URL (完整路徑)
# 格式: ws://<後端IP>:<後端Port>/ws
VITE_MUJOCO_WS_URL=ws://192.168.1.100:8765/ws

# UI 顯示用 URL (不含 /ws)
VITE_MUJOCO_URL=ws://192.168.1.100:8765
```

### 步驟 2: 啟動伺服器

```bash
# 開發模式
npm run dev

# 輸出:
#   VITE v7.x.x  ready in xxx ms
#
#   ➜  Local:   http://localhost:3000/
#   ➜  Network: http://192.168.1.50:3000/
```

### 步驟 3: 從其他裝置存取

在同一網路的其他裝置上，開啟瀏覽器訪問：

```
http://<伺服器IP>:3000
```

### 動態設定範例

#### 場景 A: 本機開發 + 本機後端

```bash
VITE_HOST=localhost
VITE_PORT=5173
VITE_MUJOCO_WS_URL=ws://localhost:8765/ws
```

#### 場景 B: 區域網路存取 + 遠端後端

```bash
VITE_HOST=0.0.0.0
VITE_PORT=3000
VITE_MUJOCO_WS_URL=ws://192.168.1.200:8765/ws
```

#### 場景 C: 多後端切換

可在 UI 的 SYSTEM 分頁中動態修改 MuJoCo URL，無需重啟。

---

## 生產環境部署

### 方法 1: 靜態檔案伺服器

```bash
# 1. 建置
npm run build

# 2. 部署 dist/ 資料夾
# 使用 serve
npx serve -s dist -l 3000

# 或使用 http-server
npx http-server dist -p 3000

# 或使用 Python
cd dist && python -m http.server 3000
```

### 方法 2: Nginx

#### 安裝 Nginx

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx
```

#### 設定檔

建立 `/etc/nginx/sites-available/simulation-webui`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端靜態檔案
    root /var/www/simulation-webui/dist;
    index index.html;

    # SPA 路由處理
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 靜態資源快取
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # WebSocket 代理 (如果後端在同一台機器)
    location /ws {
        proxy_pass http://127.0.0.1:8765;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400;  # WebSocket 長連接
    }

    # Gzip 壓縮
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
}
```

#### 啟用設定

```bash
# 建立符號連結
sudo ln -s /etc/nginx/sites-available/simulation-webui /etc/nginx/sites-enabled/

# 測試設定
sudo nginx -t

# 重載 Nginx
sudo systemctl reload nginx
```

### 方法 3: Apache

#### 設定檔 (.htaccess)

在 `dist/` 目錄建立 `.htaccess`:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# 快取設定
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
</IfModule>
```

---

## Docker 部署

### Dockerfile

建立 `Dockerfile`:

```dockerfile
# 建置階段
FROM node:20-alpine AS builder

WORKDIR /app

# 安裝依賴
COPY package*.json ./
RUN npm ci

# 複製原始碼並建置
COPY . .
RUN npm run build

# 執行階段
FROM nginx:alpine

# 複製建置結果
COPY --from=builder /app/dist /usr/share/nginx/html

# 複製 Nginx 設定
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### nginx.conf

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  webui:
    build: .
    ports:
      - "3000:80"
    environment:
      - VITE_MUJOCO_WS_URL=ws://mujoco:8765/ws
    depends_on:
      - mujoco

  mujoco:
    image: your-mujoco-backend:latest
    ports:
      - "8765:8765"
```

### 建置與執行

```bash
# 建置映像
docker build -t simulation-webui .

# 執行容器
docker run -d -p 3000:80 simulation-webui

# 或使用 docker-compose
docker-compose up -d
```

---

## 常見問題

### Q: 無法從其他裝置存取

**A:** 檢查以下項目：

1. 確認 `VITE_HOST=0.0.0.0`
2. 檢查防火牆設定
   ```bash
   # Ubuntu
   sudo ufw allow 3000/tcp

   # CentOS
   sudo firewall-cmd --add-port=3000/tcp --permanent
   sudo firewall-cmd --reload
   ```
3. 確認 IP 位址正確

### Q: WebSocket 連線失敗

**A:** 可能原因：

1. MuJoCo 後端未啟動
2. URL 設定錯誤（檢查 IP、Port、路徑）
3. 防火牆阻擋 WebSocket 連線
4. 使用 Nginx 代理時缺少 WebSocket 相關 headers

### Q: 建置後資源載入失敗

**A:** 檢查 `vite.config.ts` 的 `base` 設定：

```typescript
export default defineConfig({
  base: '/',  // 或 '/your-subpath/'
  // ...
});
```

### Q: 如何啟用 HTTPS？

**A:** 使用 Let's Encrypt + Nginx：

```bash
# 安裝 certbot
sudo apt install certbot python3-certbot-nginx

# 取得憑證
sudo certbot --nginx -d your-domain.com

# 自動更新
sudo systemctl enable certbot.timer
```

對應的 WebSocket URL 需改為 `wss://`:

```bash
VITE_MUJOCO_WS_URL=wss://your-domain.com/ws
```

### Q: 效能優化建議

**A:**

1. 啟用 Gzip/Brotli 壓縮
2. 使用 CDN 加速靜態資源
3. 設定適當的快取策略
4. 考慮使用 WebSocket 壓縮 (permessage-deflate)
