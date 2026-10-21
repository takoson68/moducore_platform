// 執行模組生命週期；清理階段持續收集錯誤以完成其餘清理。
export async function runGameHooks(modules, hook, context, { reverse = false, cleanup = false } = {}) {
  const ordered = reverse ? [...modules].reverse() : modules;
  const errors = [];
  for (const module of ordered) {
    try {
      await module[hook]?.(context);
    } catch (error) {
      if (!cleanup) throw error;
      errors.push(error);
    }
  }
  if (errors.length) throw new AggregateError(errors, `[Game] ${hook} 失敗`);
}
