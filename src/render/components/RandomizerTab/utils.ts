import { GRID_COLS_MAP } from "./constants.ts";

export const calculateTargetSizes = (
  totalStudents: number,
  divisionMode: 'groups' | 'people',
  groupCount: number,
  peoplePerGroup: number
): number[] => {
  const targetSizes: number[] = [];

  if (divisionMode === 'groups') {
    const base = Math.floor(totalStudents / groupCount);
    const remainder = totalStudents % groupCount;
    for (let i = 0; i < groupCount; i++) {
      targetSizes.push(base + (i < remainder ? 1 : 0));
    }
  } else {
    let remaining = totalStudents;
    while (remaining > 0) {
      targetSizes.push(Math.min(peoplePerGroup, remaining));
      remaining -= peoplePerGroup;
    }
  }

  return targetSizes;
}

export const getGridColumnsClass = (groupCount: number): string => {
  if (groupCount <= 3) return GRID_COLS_MAP[3];
  if (groupCount <= 4) return GRID_COLS_MAP[4];
  if (groupCount <= 6) return GRID_COLS_MAP[6];
  return GRID_COLS_MAP.default;
};