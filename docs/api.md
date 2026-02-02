# MuJoCo 後端 API 文件

本文件說明前端與 MuJoCo Python 後端之間的 WebSocket 通訊協議。

## 連線

### WebSocket 端點

```
ws://<host>:<port>/ws
```

預設: `ws://localhost:8765/ws`

### 連線流程

```
Client                          Server
   │                               │
   │──── WebSocket Connect ────────►│
   │                               │
   │◄──── Connection Established ──│
   │                               │
   │◄──── Robot State (60Hz) ──────│
   │◄──── Robot State ─────────────│
   │◄──── Robot State ─────────────│
   │                               │
   │──── Control Command ──────────►│
   │                               │
   │◄──── Robot State ─────────────│
   │                               │
```

## 訊息格式

### 機器人狀態 (Server → Client)

伺服器以 60Hz 頻率持續發送機器人狀態：

```typescript
interface RobotState {
  // 時間戳記
  timestamp: number;

  // 機體位置 [x, y, z] (公尺)
  base_position: [number, number, number];

  // 機體姿態四元數 [w, x, y, z]
  base_quaternion: [number, number, number, number];

  // 機體線速度 [vx, vy, vz] (m/s)
  base_velocity: [number, number, number];

  // 機體角速度 [wx, wy, wz] (rad/s)
  base_angular_velocity: [number, number, number];

  // 關節位置 (弧度)
  joint_positions: {
    FR_hip: number;
    FR_thigh: number;
    FR_calf: number;
    FL_hip: number;
    FL_thigh: number;
    FL_calf: number;
    RR_hip: number;
    RR_thigh: number;
    RR_calf: number;
    RL_hip: number;
    RL_thigh: number;
    RL_calf: number;
  };

  // 關節速度 (rad/s)
  joint_velocities: Record<string, number>;

  // 接觸點資訊
  contacts: Array<{
    pos: [number, number, number];  // 接觸位置
    force: number;                   // 接觸力 (N)
  }>;

  // 模擬時間 (秒)
  sim_time: number;

  // 即時係數 (1.0 = 實時)
  real_time_factor: number;
}
```

### 控制指令 (Client → Server)

客戶端可發送以下控制指令：

#### 1. 位置控制

```typescript
interface PositionCommand {
  command_type: 'position';
  target_position: [number, number, number];  // 目標位置 [x, y, z]
}
```

#### 2. 關節位置控制

```typescript
interface JointPositionCommand {
  command_type: 'position';
  joint_targets: {
    FR_hip?: number;
    FR_thigh?: number;
    FR_calf?: number;
    // ... 其他關節
  };
}
```

#### 3. 速度控制

```typescript
interface VelocityCommand {
  command_type: 'velocity';
  target_velocity: [number, number, number];  // [vx, vy, vyaw]
}
```

#### 4. 扭矩控制

```typescript
interface TorqueCommand {
  command_type: 'torque';
  joint_torques: Record<string, number>;
}
```

#### 5. 行走指令

```typescript
interface WalkCommand {
  command_type: 'walk';
  gait_params?: {
    frequency?: number;     // 步態頻率 (Hz)
    amplitude?: number;     // 步態幅度
    direction?: [number, number];  // 行走方向 [x, y]
  };
}
```

#### 6. 停止指令

```typescript
interface StopCommand {
  command_type: 'stop';
}
```

## 範例程式碼

### TypeScript 客戶端

```typescript
// 連線
const ws = new WebSocket('ws://localhost:8765/ws');

ws.onopen = () => {
  console.log('Connected to MuJoCo');
};

// 接收狀態
ws.onmessage = (event) => {
  const state: RobotState = JSON.parse(event.data);
  console.log('Position:', state.base_position);
};

// 發送指令
function walk() {
  ws.send(JSON.stringify({
    command_type: 'walk',
    gait_params: {
      frequency: 2.0,
      amplitude: 0.1,
    },
  }));
}

function stop() {
  ws.send(JSON.stringify({
    command_type: 'stop',
  }));
}
```

### Python 後端範例

```python
import asyncio
import websockets
import json
import mujoco

class MuJoCoServer:
    def __init__(self, model_path: str):
        self.model = mujoco.MjModel.from_xml_path(model_path)
        self.data = mujoco.MjData(self.model)

    async def handler(self, websocket):
        try:
            # 開始模擬迴圈
            while True:
                # 步進物理
                mujoco.mj_step(self.model, self.data)

                # 發送狀態
                state = self.get_robot_state()
                await websocket.send(json.dumps(state))

                # 檢查指令
                try:
                    message = await asyncio.wait_for(
                        websocket.recv(),
                        timeout=1/60  # 60Hz
                    )
                    command = json.loads(message)
                    self.process_command(command)
                except asyncio.TimeoutError:
                    pass

        except websockets.ConnectionClosed:
            print("Client disconnected")

    def get_robot_state(self) -> dict:
        return {
            "timestamp": self.data.time,
            "base_position": self.data.qpos[:3].tolist(),
            "base_quaternion": self.data.qpos[3:7].tolist(),
            "base_velocity": self.data.qvel[:3].tolist(),
            "base_angular_velocity": self.data.qvel[3:6].tolist(),
            "joint_positions": self._get_joint_positions(),
            "joint_velocities": self._get_joint_velocities(),
            "contacts": self._get_contacts(),
            "sim_time": self.data.time,
            "real_time_factor": 1.0,
        }

    def process_command(self, command: dict):
        cmd_type = command.get("command_type")
        if cmd_type == "walk":
            self._start_walk(command.get("gait_params", {}))
        elif cmd_type == "stop":
            self._stop()
        elif cmd_type == "position":
            self._set_position(command.get("joint_targets", {}))

async def main():
    server = MuJoCoServer("robot.xml")
    async with websockets.serve(server.handler, "0.0.0.0", 8765):
        print("MuJoCo server started on ws://0.0.0.0:8765")
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    asyncio.run(main())
```

## 錯誤處理

### 連線錯誤

```typescript
ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = (event) => {
  console.log('Connection closed:', event.code, event.reason);
  // 實作重連邏輯
  setTimeout(() => reconnect(), 3000);
};
```

### 常見錯誤碼

| 錯誤碼 | 說明 |
|-------|------|
| 1000 | 正常關閉 |
| 1001 | 端點離開 |
| 1006 | 異常關閉 (無 close frame) |
| 1011 | 伺服器內部錯誤 |

## 效能考量

1. **訊息頻率**: 預設 60Hz，可根據需求調整
2. **訊息大小**: 單一狀態訊息約 1-2KB
3. **延遲**: 區域網路 < 5ms，網際網路視情況
4. **頻寬**: 約 60-120 KB/s 上行

## 安全性

- 生產環境建議使用 `wss://` (WebSocket Secure)
- 可加入 token 驗證機制
- 建議限制連線來源 IP
