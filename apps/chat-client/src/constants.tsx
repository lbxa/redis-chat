import { v4 as uuidv4 } from 'uuid';

export const $C = {
  CLIENT_ID: uuidv4(),
  MAX_RECONNECT_ATTEMPTS: 5,
  BASE_RECONNECT_DELAY: 1000,
  PING_INTERVAL_MS: 15000, // 15 seconds
  PONG_TIMEOUT_MS: 5000, // 5 seconds
} as const;