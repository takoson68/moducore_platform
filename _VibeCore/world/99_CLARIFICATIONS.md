# Clarifications & Gaps

本文件收納「曾在工程／討論中出現，但未被世界正式定義」的裁決或缺口。
內容僅整理來源，不新增世界規則。

## 來源：`_VibeCore/world/IMPLICIT_WORLD_ASSUMPTIONS.txt`

A. 世界狀態與完成語意
1. 世界載入完成（World Ready）的判斷條件未定義。
2. 世界載入失敗時的行為（停止/回報/fallback）未定義。
3. 世界「可操作」與「僅可分析」的狀態差異未命名。

B. 錯誤與非法行為回應方式
4. 當行為違反 World Rules 時的回應模式未定義。
5. 當輸出不符合 Structure/Naming 時的處理方式未定義。
6. AI 不確定是否合法時的預設行為未被明文化。

C. 產出狀態的中間層
7. 合法但未完成的產出狀態尚未正式命名或定義。
8. 是否允許暫存產出（placeholder）尚未正式定義。

D. 世界變更與版本語意
9. World 版本號命名方式未定義（08 提及但未細化）。
10. 不同 World 版本的相容性判斷未定義。

E. 模組與語法層的延後決策
11. 模組宣告是否需要正式 DSL/Schema 未定義。
12. Module index.js 的最小必要輸出欄位未形成硬規範。

F. 路由與權限的未封死區域
13. Router 是否最終完全容器化未定義。
14. 路由守衛與模組裁決的責任邊界未寫成條文。

G. 多人 / 多工具情境
15. 多人同時修改 world 的衝突處理不屬於 world 層。
16. 多 AI session 同時進入世界的行為尚未明文化。

H. 世界與外部系統切割
17. world 與後端實作的同步語意未定義（tenant_id 已存在）。
18. world 對 API 穩定性的假設未描述。

I. 作者與 AI 的行為默契
19. 作者可手動介入覆寫 AI 建議的時機未寫入文件。
20. AI 在模糊需求下「必須反問」的門檻未獨立列條。

## 來源：`_VibeCore/feedback/目錄推論.md`
- `_VibeCore/projects/` 與 `_VibeCore/projects/modules/` 的存在性為工程推論，需世界或工程正式定義。
- `_VibeCore/outputs/`、`_VibeCore/prompts/`、`_VibeCore/tools/` 的存在性為工程推論，需世界或工程正式定義。

---

End of Clarifications & Gaps
