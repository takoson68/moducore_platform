/**
 * Platform Tools Facade
 *
 * 此文件為平台對外公開能力出口。
 * 模組禁止直接 import app/* 目錄底層實作。
 *
 * 合法用法：
 *   import { createStore } from "@/core";
 */

import { services } from "@/app/container/services/index.js";

// 狀態工廠
export { createStore } from "@/app/stores/_storeFactory.js";
export { resolveWorldVisibility } from "./visibility.js";

// 事件系統（若存在）
export const eventBus = services.eventBus;

// world 仍保留直接使用權（但不收斂）
// world 不應從 core 暴露，以維持治理層獨立
