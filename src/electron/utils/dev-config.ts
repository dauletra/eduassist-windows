// src/electron/utils/dev-config.ts

export function getDevPort(): string {
  return '5123';
}

export function getDevUrl(path: string = ''): string {
  const port = getDevPort();
  return `http://localhost:${port}${path}`;
}

export function isDev(): boolean {
  return process.env.NODE_ENV === 'development';
}