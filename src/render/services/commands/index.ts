// src/render/services/commands/index.ts

// Экспортируем только новую систему
export * from './types';
export * from './NewCommandDispatcher';
export * from './FinalCommandDispatcher'; // Основной экспорт
export * from './newCommands'; // Все команды

// Убраны экспорты старой системы:
// - CommandHandler
// - CommandGateway
// - EventProcessor
// - CommandExecutor