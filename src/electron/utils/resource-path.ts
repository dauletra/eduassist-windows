// src/electron/utils/resource-path.ts
import { app } from 'electron';
import path from 'path';
import fs from 'fs';
import { isDev } from './dev-config.js';

/**
 * Получение пути к ресурсам в зависимости от среды
 */
export function getResourcePath(): string {
  if (isDev()) {
    // В development - из папки public/resources
    return path.join(process.cwd(), 'resources', 'models');
  } else {
    // В production - из папки resources рядом с исполняемым файлом
    return path.join(path.dirname(app.getPath('exe')), 'resources');
  }
}

/**
 * Получение пути к конкретному файлу модели
 */
export function getModelPath(modelName: string): string {
  const resourcePath = getResourcePath();
  const modelPath = path.join(resourcePath, modelName);

  console.log('🔍 Model path resolution:', {
    resourcePath,
    modelName,
    modelPath,
    exists: fs.existsSync(modelPath)
  });

  // Проверяем существование файла
  if (!fs.existsSync(modelPath)) {
    console.error('❌ Model file not found:', modelPath);
    console.log('📁 Files in resources directory:');
    try {
      const files = fs.readdirSync(resourcePath);
      console.log('📄', files);
    } catch (err) {
      console.error('❌ Cannot read resources directory:', err);
    }
    throw new Error(`Model file not found: ${modelPath}`);
  }

  return modelPath;
}

/**
 * Получение URL для использования в рендерере
 */
export function getModelUrl(modelName: string): string {
  if (isDev()) {
    return `/resources/${modelName}`;
  } else {
    const modelPath = getModelPath(modelName);
    return `file://${modelPath}`;
  }
}