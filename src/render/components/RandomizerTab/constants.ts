export const ANIMATION_DELAYS = {
  RANDOMIZE_STEP: 100,
  PLACEMENT_STEP: 300,
  MESSAGE_DISPLAY: 800,
  RESULT_DISPLAY: 1000,
} as const;

export const RANDOMIZE_ITERATIONS = 10;

export const GRID_COLS_MAP = {
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  6: 'grid-cols-3',
  default: 'grid-cols-4',
} as const;
