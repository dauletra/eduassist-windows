// src/render/services/commands/index.ts

// Экспортируем только новую систему
export * from './types';
export * from './CommandDispatcher'; // Основной экспорт
export * from './newCommands'; // Все команды

// Убраны экспорты старой системы:
// - CommandHandler
// - CommandGateway
// - EventProcessor
// - CommandExecutor