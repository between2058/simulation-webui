"""
MuJoCo Physics Simulation Server for Unitree Go2 Robot Dog

This server runs the actual physics simulation using MuJoCo and streams
the robot state to the web frontend via WebSocket.

Architecture:
    Frontend (Three.js) <--WebSocket--> Backend (MuJoCo)
    - Frontend: Visualization only
    - Backend: Actual physics computation

Usage:
    pip install -r requirements.txt
    python mujoco_server.py
"""

import asyncio
import json
import time
from pathlib import Path
from typing import Dict, Any, Optional
from dataclasses import dataclass, asdict

import numpy as np
import mujoco
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn


# Configuration
MODEL_PATH = Path(__file__).parent.parent / "public" / "models" / "go2" / "go2.xml"
SIMULATION_TIMESTEP = 0.002  # 500 Hz physics
BROADCAST_RATE = 60  # 60 FPS to frontend


@dataclass
class RobotState:
    """Complete robot state for frontend visualization"""
    timestamp: float
    # Base position and orientation
    base_position: list  # [x, y, z]
    base_quaternion: list  # [w, x, y, z]
    base_velocity: list  # [vx, vy, vz]
    base_angular_velocity: list  # [wx, wy, wz]
    # Joint states (12 joints for quadruped)
    joint_positions: Dict[str, float]
    joint_velocities: Dict[str, float]
    # Contact information
    contacts: list  # List of contact points
    # Simulation info
    sim_time: float
    real_time_factor: float


@dataclass
class ControlCommand:
    """Control command from frontend"""
    command_type: str  # "position", "velocity", "torque", "walk", "stop"
    target_position: Optional[list] = None  # [x, y, z] for navigation
    joint_targets: Optional[Dict[str, float]] = None
    gait_params: Optional[Dict[str, float]] = None


class Go2Simulation:
    """MuJoCo simulation wrapper for Unitree Go2"""

    # Joint names matching the MJCF model
    JOINT_NAMES = [
        "FR_hip_joint", "FR_thigh_joint", "FR_calf_joint",
        "FL_hip_joint", "FL_thigh_joint", "FL_calf_joint",
        "RR_hip_joint", "RR_thigh_joint", "RR_calf_joint",
        "RL_hip_joint", "RL_thigh_joint", "RL_calf_joint",
    ]

    def __init__(self, model_path: Path):
        print(f"Loading MuJoCo model from: {model_path}")

        if not model_path.exists():
            raise FileNotFoundError(f"Model not found: {model_path}")

        # Load MuJoCo model
        self.model = mujoco.MjModel.from_xml_path(str(model_path))
        self.data = mujoco.MjData(self.model)

        # Set simulation parameters
        self.model.opt.timestep = SIMULATION_TIMESTEP

        # Get joint indices
        self.joint_ids = {}
        for name in self.JOINT_NAMES:
            try:
                self.joint_ids[name] = mujoco.mj_name2id(
                    self.model, mujoco.mjtObj.mjOBJ_JOINT, name
                )
            except Exception:
                print(f"Warning: Joint '{name}' not found in model")

        # Initialize to standing pose
        self._set_standing_pose()

        # Timing
        self.last_step_time = time.time()
        self.sim_time = 0.0

        print(f"Simulation initialized. Joints: {list(self.joint_ids.keys())}")

    def _set_standing_pose(self):
        """Set the robot to a stable standing pose"""
        # Default standing angles from MJCF keyframe
        standing_angles = {
            "FR_hip_joint": 0.0, "FR_thigh_joint": 0.9, "FR_calf_joint": -1.8,
            "FL_hip_joint": 0.0, "FL_thigh_joint": 0.9, "FL_calf_joint": -1.8,
            "RR_hip_joint": 0.0, "RR_thigh_joint": 0.9, "RR_calf_joint": -1.8,
            "RL_hip_joint": 0.0, "RL_thigh_joint": 0.9, "RL_calf_joint": -1.8,
        }

        for name, angle in standing_angles.items():
            if name in self.joint_ids:
                idx = self.joint_ids[name]
                self.data.qpos[7 + idx] = angle  # Skip base position (7 DOF)

        # Set base height
        self.data.qpos[2] = 0.35  # z position

        # Forward simulation to settle
        mujoco.mj_forward(self.model, self.data)

    def step(self, n_steps: int = 1) -> RobotState:
        """Advance simulation by n steps"""
        current_time = time.time()

        for _ in range(n_steps):
            mujoco.mj_step(self.model, self.data)
            self.sim_time += SIMULATION_TIMESTEP

        # Calculate real-time factor
        elapsed = time.time() - current_time
        rtf = (n_steps * SIMULATION_TIMESTEP) / max(elapsed, 1e-6)
        self.last_step_time = current_time

        return self.get_state(rtf)

    def get_state(self, rtf: float = 1.0) -> RobotState:
        """Get current robot state"""
        # Base state (first 7 DOF: pos[3] + quat[4])
        base_pos = self.data.qpos[:3].tolist()
        base_quat = self.data.qpos[3:7].tolist()
        base_vel = self.data.qvel[:3].tolist()
        base_angvel = self.data.qvel[3:6].tolist()

        # Joint states
        joint_pos = {}
        joint_vel = {}
        for name, idx in self.joint_ids.items():
            joint_pos[name] = float(self.data.qpos[7 + idx])
            joint_vel[name] = float(self.data.qvel[6 + idx])

        # Contact information
        contacts = []
        for i in range(self.data.ncon):
            contact = self.data.contact[i]
            contacts.append({
                "pos": contact.pos.tolist(),
                "force": float(np.linalg.norm(self.data.efc_force[contact.efc_address:contact.efc_address+3]))
                if contact.efc_address >= 0 else 0.0
            })

        return RobotState(
            timestamp=time.time(),
            base_position=base_pos,
            base_quaternion=base_quat,
            base_velocity=base_vel,
            base_angular_velocity=base_angvel,
            joint_positions=joint_pos,
            joint_velocities=joint_vel,
            contacts=contacts[:4],  # Max 4 feet
            sim_time=self.sim_time,
            real_time_factor=rtf
        )

    def apply_control(self, command: ControlCommand):
        """Apply control command to the robot"""
        if command.command_type == "torque" and command.joint_targets:
            for name, torque in command.joint_targets.items():
                if name in self.joint_ids:
                    idx = self.joint_ids[name]
                    self.data.ctrl[idx] = torque

        elif command.command_type == "position" and command.joint_targets:
            # PD control to target positions
            kp, kd = 50.0, 2.0
            for name, target in command.joint_targets.items():
                if name in self.joint_ids:
                    idx = self.joint_ids[name]
                    current = self.data.qpos[7 + idx]
                    velocity = self.data.qvel[6 + idx]
                    self.data.ctrl[idx] = kp * (target - current) - kd * velocity

        elif command.command_type == "walk":
            self._apply_walking_gait(command.gait_params or {})

        elif command.command_type == "stop":
            self.data.ctrl[:] = 0

    def _apply_walking_gait(self, params: Dict[str, float]):
        """Apply a simple walking gait"""
        t = self.sim_time
        freq = params.get("frequency", 2.0)
        amplitude = params.get("amplitude", 0.3)

        # Simple diagonal gait
        phase = t * freq * 2 * np.pi

        # Front-right and Rear-left
        fr_rl_swing = amplitude * np.sin(phase)
        # Front-left and Rear-right
        fl_rr_swing = amplitude * np.sin(phase + np.pi)

        # Apply to thigh joints
        targets = {
            "FR_thigh_joint": 0.9 + fr_rl_swing,
            "RL_thigh_joint": 0.9 + fr_rl_swing,
            "FL_thigh_joint": 0.9 + fl_rr_swing,
            "RR_thigh_joint": 0.9 + fl_rr_swing,
            "FR_calf_joint": -1.8 + abs(fr_rl_swing) * 0.5,
            "RL_calf_joint": -1.8 + abs(fr_rl_swing) * 0.5,
            "FL_calf_joint": -1.8 + abs(fl_rr_swing) * 0.5,
            "RR_calf_joint": -1.8 + abs(fl_rr_swing) * 0.5,
        }

        # PD control
        kp, kd = 100.0, 5.0
        for name, target in targets.items():
            if name in self.joint_ids:
                idx = self.joint_ids[name]
                current = self.data.qpos[7 + idx]
                velocity = self.data.qvel[6 + idx]
                self.data.ctrl[idx] = kp * (target - current) - kd * velocity

    def reset(self):
        """Reset simulation to initial state"""
        mujoco.mj_resetData(self.model, self.data)
        self._set_standing_pose()
        self.sim_time = 0.0


# FastAPI Application
app = FastAPI(title="MuJoCo Robot Simulation Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global simulation instance
simulation: Optional[Go2Simulation] = None
connected_clients: set = set()


@app.on_event("startup")
async def startup():
    global simulation
    try:
        simulation = Go2Simulation(MODEL_PATH)
        print("MuJoCo simulation started successfully!")
    except Exception as e:
        print(f"Failed to initialize simulation: {e}")
        print("Server will start but simulation won't work.")


@app.get("/")
async def root():
    return {
        "status": "running",
        "simulation_active": simulation is not None,
        "connected_clients": len(connected_clients),
        "model_path": str(MODEL_PATH),
    }


@app.get("/state")
async def get_state():
    """Get current robot state (REST endpoint for debugging)"""
    if simulation is None:
        return {"error": "Simulation not initialized"}
    return asdict(simulation.get_state())


@app.post("/reset")
async def reset_simulation():
    """Reset the simulation"""
    if simulation:
        simulation.reset()
        return {"status": "reset"}
    return {"error": "Simulation not initialized"}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time simulation streaming"""
    await websocket.accept()
    connected_clients.add(websocket)
    print(f"Client connected. Total: {len(connected_clients)}")

    try:
        # Start simulation loop for this client
        steps_per_broadcast = int(1.0 / (BROADCAST_RATE * SIMULATION_TIMESTEP))

        while True:
            # Check for incoming commands
            try:
                data = await asyncio.wait_for(
                    websocket.receive_text(),
                    timeout=1.0 / BROADCAST_RATE
                )
                command_data = json.loads(data)
                command = ControlCommand(**command_data)
                if simulation:
                    simulation.apply_control(command)
            except asyncio.TimeoutError:
                pass  # No command received, continue simulation
            except json.JSONDecodeError:
                print("Invalid JSON command received")

            # Step simulation and broadcast state
            if simulation:
                state = simulation.step(steps_per_broadcast)
                await websocket.send_json(asdict(state))
            else:
                await asyncio.sleep(1.0 / BROADCAST_RATE)

    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        connected_clients.discard(websocket)
        print(f"Client removed. Total: {len(connected_clients)}")


if __name__ == "__main__":
    print("=" * 60)
    print("MuJoCo Robot Simulation Server")
    print("=" * 60)
    print(f"Model: {MODEL_PATH}")
    print(f"Physics rate: {1/SIMULATION_TIMESTEP:.0f} Hz")
    print(f"Broadcast rate: {BROADCAST_RATE} FPS")
    print("=" * 60)

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8765,
        log_level="info"
    )
