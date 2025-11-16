// src/render/utils/gradeValidation.ts

export function validateGrade(value: string): number | null {
  // Пустая строка → удаляем оценку
  if (value.trim() === '') {
    return null;
  }

  const num = parseInt(value, 10);

  // NaN или не число → null
  if (isNaN(num)) {
    return null;
  }

  // Диапазон 1-10
  if (num < 1 || num > 10) {
    return null;
  }

  return num;
}

export function formatGradeInput(value: string): string {
  // Удаляем всё кроме цифр
  const onlyDigits = value.replace(/\D/g, '');

  // Ограничиваем двумя символами
  return onlyDigits.slice(0, 2);
}