import { GRID_COLS_MAP } from "./constants.ts";
// Re-export для обратной совместимости
export { calculateTargetSizes } from '../../services/commands/definitions/groupFormationAlgorithm';

export const getGridColumnsClass = (groupCount: number): string => {
  if (groupCount <= 3) return GRID_COLS_MAP[3];
  if (groupCount <= 4) return GRID_COLS_MAP[4];
  if (groupCount <= 6) return GRID_COLS_MAP[6];
  return GRID_COLS_MAP.default;
};