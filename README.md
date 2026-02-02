# RoboDog Simulation WebUI

基於 React + Three.js 的四足機器人模擬控制介面，支援多機器人協作、MuJoCo 物理後端整合、3D 場景編輯與任務規劃。

## 功能特色

- **3D 視覺化模擬** - 使用 Three.js/React Three Fiber 渲染機器人與場景
- **多機器人支援** - 同時控制最多 8 台機器人，支援編隊控制
- **MuJoCo 物理整合** - 透過 WebSocket 連接 MuJoCo 物理引擎後端
- **GLB/GLTF 模型上傳** - 支援拖放上傳自訂 3D 模型
- **任務規劃系統** - 巡邏路徑設定、任務歷史紀錄
- **畫中畫視角** - 機器人第一人稱視角顯示
- **場景匯入/匯出** - JSON 格式儲存與載入場景設定

## 快速開始

### 安裝依賴

```bash
npm install
```

### 開發模式

```bash
npm run dev
```

開啟瀏覽器訪問 `http://localhost:5173`

### 建置生產版本

```bash
npm run build
npm run preview
```

## 部署設定

### 環境變數設定

複製 `.env.example` 為 `.env` 並修改設定：

```bash
cp .env.example .env
```

### 設定自訂 IP 與 Port

若需要在特定 IP（如 `0.0.0.0`）上部署，並自訂前端與後端 Port：

#### 1. 修改 `.env` 檔案

```bash
# ---- 前端伺服器設定 ----
# 使用 0.0.0.0 允許網路存取
VITE_HOST=0.0.0.0
# 自訂前端 Port（預設 5173）
VITE_PORT=3000

# ---- MuJoCo 後端設定 ----
# WebSocket 完整 URL（含 /ws 路徑）
VITE_MUJOCO_WS_URL=ws://192.168.1.100:8765/ws
# UI 顯示用 URL（不含 /ws 路徑）
VITE_MUJOCO_URL=ws://192.168.1.100:8765
```

#### 2. 啟動開發伺服器

```bash
npm run dev
```

伺服器將在 `http://0.0.0.0:3000` 啟動，可從區域網路其他裝置存取。

#### 3. 生產部署

```bash
# 建置
npm run build

# 預覽（使用環境變數設定）
npm run preview
```

或使用任何靜態檔案伺服器部署 `dist/` 資料夾：

```bash
# 使用 serve
npx serve -s dist -l 3000

# 使用 nginx（見下方設定）
```

### Nginx 反向代理設定

若使用 Nginx 部署，可參考以下設定：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端靜態檔案
    location / {
        root /path/to/simulation-webui/dist;
        try_files $uri $uri/ /index.html;
    }

    # WebSocket 代理（MuJoCo 後端）
    location /ws {
        proxy_pass http://127.0.0.1:8765;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

## 環境變數參考

| 變數名稱 | 說明 | 預設值 |
|---------|------|--------|
| `VITE_HOST` | 伺服器綁定位址 | `localhost` |
| `VITE_PORT` | 開發伺服器 Port | `5173` |
| `VITE_PREVIEW_PORT` | 預覽伺服器 Port | `4173` |
| `VITE_MUJOCO_WS_URL` | MuJoCo WebSocket URL | `ws://localhost:8765/ws` |
| `VITE_MUJOCO_URL` | MuJoCo 連線 URL（UI 顯示） | `ws://localhost:8765` |
| `VITE_MUJOCO_RECONNECT_DELAY` | 重連延遲（毫秒） | `3000` |
| `VITE_MAX_ROBOTS` | 最大機器人數量 | `8` |
| `VITE_DEFAULT_SPEED` | 預設模擬速度 | `1.0` |
| `VITE_MAX_SPEED` | 最大模擬速度 | `3.0` |
| `VITE_APP_VERSION` | 應用版本號 | `1.0.0` |
| `VITE_APP_TITLE` | 應用標題 | `RoboDog Simulation` |

## 專案結構

```
simulation-webui/
├── docs/                    # 文件資料夾
│   ├── architecture.md      # 架構說明
│   ├── api.md              # API 文件
│   └── deployment.md       # 部署指南
├── src/
│   ├── components/         # React 元件
│   │   ├── Camera/         # 攝影機相關
│   │   ├── Robot/          # 機器人模型
│   │   ├── Scene/          # 3D 場景
│   │   └── UI/             # 使用者介面
│   │       └── Tabs/       # 分頁元件
│   ├── config/             # 設定檔
│   ├── hooks/              # React Hooks
│   ├── stores/             # Zustand 狀態管理
│   └── styles/             # 全域樣式
├── .env.example            # 環境變數範本
├── vite.config.ts          # Vite 設定
└── package.json
```

## 使用介面說明

應用程式左側為主控制面板，分為四個分頁：

### CONTROL（控制）
- **步態模式**: Stand / Trot / Walk / Pace / Bound / Gallop
- **速度控制**: 前進(X)、橫移(Y)、旋轉(Yaw)
- **姿態控制**: 高度、Roll、Pitch、Yaw
- **編隊控制**: Line / Wedge / Column / Diamond
- **緊急停止按鈕**

### MISSION（任務）
- **巡邏模式**: Single（單一機器人）/ Distributed（分散式）
- **路徑點管理**: 新增、移除、調整等待時間
- **任務控制**: 開始 / 暫停 / 繼續 / 停止
- **即時統計**: 已訪問路徑點、已行距離、剩餘時間
- **任務歷史**: 匯出 JSON / CSV

### SCENE（場景）
- **預設場景**: Warehouse / Office / Outdoor / Factory
- **3D 模型上傳**: 支援 GLB / GLTF 格式，拖放上傳
- **障礙物編輯器**
- **顯示選項**: Grid / LiDAR 開關

### SYSTEM（系統）
- **MuJoCo 後端連線**
- **機器人艦隊管理**: 新增/移除機器人、設定領隊
- **畫中畫設定**
- **模擬速度調整**
- **場景匯入/匯出**

## MuJoCo 後端

本專案需配合 MuJoCo Python 後端使用才能獲得真實物理模擬。後端透過 WebSocket 提供：

- 機器人狀態即時更新（位置、姿態、關節角度）
- 控制指令接收（步態、速度、姿態）
- 物理碰撞偵測

詳細的後端設定請參考 [docs/api.md](docs/api.md)。

## 技術棧

- **React 19** - UI 框架
- **Three.js / React Three Fiber** - 3D 渲染
- **Zustand** - 狀態管理
- **Vite** - 建置工具
- **TypeScript** - 型別安全

## 授權

MIT License
