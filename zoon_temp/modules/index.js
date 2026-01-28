// src/modules/index.js
// --------------------------------------------------
// 模組裝配層（Module Assembly Layer）
// 這邊只收集模組定義，並且回傳給平台決定是否安裝
//
// 職責說明：
// 1. 動態載入所有模組定義（僅 import，不做任何安裝）
// 2. 根據 allowList 決定哪些模組「存在於世界中」
// 3. 將模組宣告的資源（stores / routes）註冊進平台
//
// 注意：
// - 本檔案不處理 public / auth / nav 等語意
// - 本檔案是「唯一允許產生副作用」的模組層
// --------------------------------------------------

// --------------------------------------------------
// 模組載入對照表（模組名稱 → loader）
// --------------------------------------------------

// export const moduleLoaders = {
//   shell: () => import("./shell/index.js"),
//   dashboard: () => import("./dashboard"),
//   employee: () => import("./employee"),
//   task: () => import("./task"),
//   vote: () => import("./vote"),
//   mtk2mad: () => import("./mtk2mad"),
// };

import { registerUISlot } from "@/app/_uiRegistry";

const modules = import.meta.glob("./*/index.js");
// vite自動去掃modules/ 底下的模組
//- 排除 _archive 資料夾內的模組
export const moduleLoaders = Object.fromEntries(
  Object.entries(modules)
    .filter(([path]) => !path.includes("/_archive/"))
    .map(([path, loader]) => {
      const name = path.split("/")[1];
      return [name, loader];
    })
);
// console.log("[modules]", Object.keys(modules));

// --------------------------------------------------
// 內部快取
// --------------------------------------------------
const loadedModules = new Map(); // 已載入的模組定義
const installedModules = new Set(); // 已安裝的模組（避免重複安裝）

// --------------------------------------------------
// 載入模組定義（不產生任何副作用）
// --------------------------------------------------
export async function loadModules() {
  for (const [name, loader] of Object.entries(moduleLoaders)) {
    if (loadedModules.has(name)) continue;
    if (typeof loader !== "function") continue;

    const imported = await loader();
    loadedModules.set(name, imported?.default || null);
  }

  return loadedModules;
}

// --------------------------------------------------
// ⭐ 模組安裝唯一入口
//
// 說明：
// - 僅根據 allowList 決定模組是否存在
// - 安裝內容限於：
//   1. store 註冊
//   2. routes 註冊
// - 不判斷權限、不判斷顯示語意
// --------------------------------------------------
export async function installModules({ register, container }, { allowList = [] } = {}) {
  const modules = await loadModules();
  const allowSet = Array.isArray(allowList) ? new Set(allowList) : null;

  for (const [name, mod] of modules.entries()) {
    if (!mod) continue;

    // 若存在白名單，且模組不在清單中，視為「不存在」
    if (allowSet && !allowSet.has(name)) continue;

    // 避免模組重複安裝
    if (installedModules.has(name)) continue;

    const setup = mod.setup || {};
    const { stores, routes, ui } = setup;

    // -------------------------------
    // 註冊 stores
    // -------------------------------
    if (stores) {
      for (const [key, factory] of Object.entries(stores)) {
        register.store(key, factory);
      }
    }

    // -------------------------------
    // 註冊 routes
    // -------------------------------
    if (Array.isArray(routes)) {
      register.routes(routes);
    }

    // -------------------------------
    // 註冊 ui slots
    // -------------------------------
    if (ui?.slots && typeof ui.slots === "object") {
      for (const [slotName, descriptor] of Object.entries(ui.slots)) {
        if (Array.isArray(descriptor)) {
          descriptor.forEach((item) => registerUISlot(slotName, item));
        } else {
          registerUISlot(slotName, descriptor);
        }
      }
    }

    installedModules.add(name);
  }
}

// --------------------------------------------------
// 提供給 Router 層使用的唯讀 API
//
// 說明：
// - Router 只從平台註冊桶讀取資料
// - 不直接接觸模組內部結構
// --------------------------------------------------
export async function buildModuleRoutes() {
  const bucket = window.__MODULE_ROUTES__ || { public: [], auth: [] };

  return {
    publicRoutes: [...(bucket.public || [])],
    authRoutes: [...(bucket.auth || [])],
  };
}
