/**
 * MuJoCo Simulation WebSocket Hook
 *
 * Connects to the Python MuJoCo backend and receives real-time physics state.
 * Sends control commands to the backend.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSimulationStore } from '../stores/simulationStore';
import { MUJOCO_CONFIG } from '../config';
import * as THREE from 'three';

// Types matching Python backend
interface RobotState {
  timestamp: number;
  base_position: [number, number, number];
  base_quaternion: [number, number, number, number]; // [w, x, y, z]
  base_velocity: [number, number, number];
  base_angular_velocity: [number, number, number];
  joint_positions: Record<string, number>;
  joint_velocities: Record<string, number>;
  contacts: Array<{ pos: [number, number, number]; force: number }>;
  sim_time: number;
  real_time_factor: number;
}

interface ControlCommand {
  command_type: 'position' | 'velocity' | 'torque' | 'walk' | 'stop';
  target_position?: [number, number, number];
  joint_targets?: Record<string, number>;
  gait_params?: {
    frequency?: number;
    amplitude?: number;
    direction?: [number, number];
  };
}

interface MuJoCoSimulationState {
  connected: boolean;
  robotState: RobotState | null;
  simTime: number;
  realTimeFactor: number;
  error: string | null;
}

const WS_URL = MUJOCO_CONFIG.WS_URL;
const RECONNECT_DELAY = MUJOCO_CONFIG.RECONNECT_DELAY;

export function useMuJoCoSimulation() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [state, setState] = useState<MuJoCoSimulationState>({
    connected: false,
    robotState: null,
    simTime: 0,
    realTimeFactor: 1,
    error: null,
  });

  const { setRobotPosition, setRobotRotation } = useSimulationStore();

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        console.log('Connected to MuJoCo server');
        setState((s) => ({ ...s, connected: true, error: null }));
      };

      ws.onmessage = (event) => {
        try {
          const robotState: RobotState = JSON.parse(event.data);

          // Update local state
          setState((s) => ({
            ...s,
            robotState,
            simTime: robotState.sim_time,
            realTimeFactor: robotState.real_time_factor,
          }));

          // Update Zustand store for visualization
          const pos = new THREE.Vector3(
            robotState.base_position[0],
            robotState.base_position[1],
            robotState.base_position[2]
          );
          setRobotPosition(pos);

          // Convert quaternion to Euler
          const quat = new THREE.Quaternion(
            robotState.base_quaternion[1], // x
            robotState.base_quaternion[2], // y
            robotState.base_quaternion[3], // z
            robotState.base_quaternion[0]  // w
          );
          const euler = new THREE.Euler().setFromQuaternion(quat);
          setRobotRotation(euler);

        } catch (e) {
          console.error('Failed to parse robot state:', e);
        }
      };

      ws.onclose = () => {
        console.log('Disconnected from MuJoCo server');
        setState((s) => ({ ...s, connected: false }));

        // Auto-reconnect
        reconnectTimeoutRef.current = setTimeout(connect, RECONNECT_DELAY);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setState((s) => ({
          ...s,
          error: 'Failed to connect to MuJoCo server. Is it running?',
        }));
      };

      wsRef.current = ws;

    } catch (e) {
      console.error('Failed to create WebSocket:', e);
      setState((s) => ({ ...s, error: 'Failed to create WebSocket connection' }));
    }
  }, [setRobotPosition, setRobotRotation]);

  // Disconnect
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setState((s) => ({ ...s, connected: false }));
  }, []);

  // Send control command
  const sendCommand = useCallback((command: ControlCommand) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(command));
    }
  }, []);

  // Convenience methods
  const startWalking = useCallback((params?: { frequency?: number; amplitude?: number }) => {
    sendCommand({
      command_type: 'walk',
      gait_params: params,
    });
  }, [sendCommand]);

  const stopWalking = useCallback(() => {
    sendCommand({ command_type: 'stop' });
  }, [sendCommand]);

  const setJointPositions = useCallback((targets: Record<string, number>) => {
    sendCommand({
      command_type: 'position',
      joint_targets: targets,
    });
  }, [sendCommand]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    ...state,
    connect,
    disconnect,
    sendCommand,
    startWalking,
    stopWalking,
    setJointPositions,
  };
}

// Type export for external use
export type { RobotState, ControlCommand, MuJoCoSimulationState };
