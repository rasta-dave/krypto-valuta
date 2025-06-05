import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
});

export const INITIAL_DIFFICULTY = 3;
export const MINE_RATE = 1000;
export const INITIAL_BALANCE = 1000;
export const MINING_REWARD = 50;

export const REWARD_ADDRESS = {
  address: '*reward-address*',
};
