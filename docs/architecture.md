# 系統架構說明

本文件說明 RoboDog Simulation WebUI 的系統架構設計。

## 整體架構

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (Client)                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│  │   React UI    │  │  Three.js    │  │    Zustand Store      │ │
│  │   Components  │◄─┤  3D Canvas   │◄─┤  (State Management)   │ │
│  └───────────────┘  └──────────────┘  └───────────────────────┘ │
│          │                                       ▲               │
│          │              WebSocket                │               │
│          └───────────────────────────────────────┘               │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                        WebSocket (ws://)
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                    MuJoCo Python Backend                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│  │   WebSocket   │  │   MuJoCo     │  │    Robot Controller   │ │
│  │    Server     │◄─┤   Physics    │◄─┤    (Gait/Motion)      │ │
│  └───────────────┘  └──────────────┘  └───────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## 前端架構

### 元件層級

```
App
├── MainControlPanel (左側控制面板)
│   ├── ControlTab (機器人控制)
│   ├── MissionTab (任務規劃)
│   ├── SceneTab (場景設定)
│   └── SystemTab (系統設定)
├── SimulationCanvas (3D 畫布)
│   ├── Environment (環境光、天空)
│   ├── Ground (地面)
│   ├── RobotModel (機器人模型)
│   ├── Waypoints (路徑點)
│   ├── Obstacles (障礙物)
│   └── CustomModels (自訂模型)
├── PictureInPicture (畫中畫)
└── StatusBar (狀態列)
```

### 狀態管理 (Zustand Store)

```typescript
// simulationStore 主要狀態
interface SimulationState {
  // 機器人相關
  robots: RobotInstance[];
  selectedRobotId: string | null;

  // 任務相關
  waypoints: Waypoint[];
  patrolStatus: PatrolStatus;
  missionHistory: MissionRecord[];

  // 場景相關
  obstacles: Obstacle[];
  customModels: CustomModel[];
  scenePreset: string;

  // UI 相關
  showPiP: boolean;
  showGrid: boolean;
  simulationSpeed: number;
}
```

### 資料流

1. **使用者操作** → UI Component → Zustand Action → State Update
2. **3D 互動** → Three.js Event → Zustand Action → State Update
3. **物理更新** → WebSocket Message → Hook → Zustand Action → State Update

## 核心模組

### 1. 設定管理 (`src/config/`)

集中管理所有可配置參數：

```typescript
// 環境變數對應
MUJOCO_CONFIG.WS_URL      ← VITE_MUJOCO_WS_URL
SERVER_CONFIG.HOST        ← VITE_HOST
SERVER_CONFIG.PORT        ← VITE_PORT
SIMULATION_CONFIG.MAX_ROBOTS ← VITE_MAX_ROBOTS
```

### 2. WebSocket Hook (`src/hooks/useMuJoCoSimulation.ts`)

負責與 MuJoCo 後端通訊：

- 連線管理（自動重連）
- 接收機器人狀態更新
- 發送控制指令

### 3. 3D 渲染 (`src/components/Scene/`)

使用 React Three Fiber 進行 3D 渲染：

- `SimulationCanvas.tsx` - 主畫布容器
- `RobotModel.tsx` - 機器人模型載入與動畫
- `Environment.tsx` - 光照與環境設定

### 4. UI 元件 (`src/components/UI/`)

分頁式控制面板：

- `MainControlPanel.tsx` - 主面板容器與 Tab 切換
- `Tabs/ControlTab.tsx` - 速度、姿態、步態控制
- `Tabs/MissionTab.tsx` - 任務規劃與歷史
- `Tabs/SceneTab.tsx` - 場景與模型管理
- `Tabs/SystemTab.tsx` - 系統設定與連線

## 檔案結構

```
src/
├── components/
│   ├── Camera/
│   │   ├── CameraController.tsx   # 攝影機控制
│   │   └── PictureInPicture.tsx   # 畫中畫視角
│   ├── Robot/
│   │   └── RobotModel.tsx         # 機器人 3D 模型
│   ├── Scene/
│   │   ├── SimulationCanvas.tsx   # 主 3D 畫布
│   │   ├── Environment.tsx        # 環境設定
│   │   ├── Ground.tsx             # 地面
│   │   └── CustomModel.tsx        # 自訂模型
│   └── UI/
│       ├── MainControlPanel.tsx   # 主控制面板
│       ├── MainControlPanel.css   # 面板樣式
│       ├── StatusBar.tsx          # 狀態列
│       └── Tabs/
│           ├── ControlTab.tsx     # 控制分頁
│           ├── MissionTab.tsx     # 任務分頁
│           ├── SceneTab.tsx       # 場景分頁
│           └── SystemTab.tsx      # 系統分頁
├── config/
│   └── index.ts                   # 集中配置
├── hooks/
│   └── useMuJoCoSimulation.ts     # MuJoCo WebSocket
├── stores/
│   └── simulationStore.ts         # Zustand 狀態
├── styles/
│   └── global.css                 # 全域樣式
├── App.tsx                        # 主應用
└── main.tsx                       # 進入點
```

## 技術選型

| 領域 | 技術 | 理由 |
|-----|------|------|
| UI 框架 | React 19 | 元件化、生態系成熟 |
| 3D 渲染 | Three.js + R3F | 宣告式 3D、與 React 整合良好 |
| 狀態管理 | Zustand | 輕量、簡潔 API |
| 建置工具 | Vite | 快速 HMR、原生 ESM |
| 型別 | TypeScript | 型別安全、IDE 支援 |

## 擴展指南

### 新增控制參數

1. 在 `simulationStore.ts` 新增狀態與 action
2. 在對應 Tab 元件新增 UI 控制
3. 若需後端支援，更新 WebSocket 訊息格式

### 新增機器人模型

1. 將 GLB/GLTF 放入 `public/models/`
2. 在 `RobotModel.tsx` 新增模型選項
3. 更新 store 的機器人類型定義

### 新增場景預設

1. 在 `SceneTab.tsx` 的 `SCENE_PRESETS` 新增選項
2. 定義預設的障礙物與模型配置
3. 實作 `loadPreset` 函式
