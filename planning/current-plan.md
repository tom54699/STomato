# 當前計畫（迭代級）

## 本週目標（React 原型）
- 完成現有畫面互動骨架：登入 / 排程 / 行事曆 / 進度 / 社交挑戰。
- 為每個畫面列出「功能缺口與假設」，方便下一步串接 API 或模擬資料。
- 由 Claude 專注 `src/` 原型，Codex 專注紀錄與任務同步。

## 下一個里程碑（React → Flutter）
- 確認 MVP 畫面與流程，凍結 UI 範圍。
- 彙整必要的後端資源（認證、計時/積分、排行榜、進度/課程資料）。
- 拆出 Flutter/後端的技術 Spike 清單。

## 工作方式
- 每次對話先複製 `.specify/templates/agent-file-template.md` 成 `notes/YYYY-MM-DD-<owner>.md`（Claude 或 Codex）。
- Claude 只改 `src/`；Codex 只改文檔/任務（`notes/`, `planning/`, `tasks/`, `docs/`, `ui/`）。
- 結束時：
  - Claude 在日誌列「改了哪些畫面、剩餘功能」。
  - Codex 更新 `tasks/in-progress.md`、`tasks/done.md`，必要時寫 `docs/decisions/ADR-YYYYMMDD-*.md`。
- Commit 命名示例：`feat: ui prototype schedule screen (claude)` / `chore: log session 2025-12-03 (codex)`。

## 協作準則（暫行，原 constitution 為模板未填）
- 分支/commit 由各自 owner 負責，避免改對方檔案範圍；必要時以新檔提出建議。
- 變更必留日誌；有決策（技術/產品）就寫 ADR，日誌連結 ADR。
- 任何 mock/假資料格式變更要在 `ui/README.md` 記一行，避免前後端認知錯位。
- 若出現衝突，優先保留「最新日誌 + ADR」所記載的真相，再回補檔案。

## 近期待辦（Codex 維護）
- [x] 為每個畫面列出功能缺口，填入 `ui/README.md`。
- [ ] 彙總 `.specify/memory/constitution.md` 的協作要點到此檔簡版。（目前模板為空，已暫行上述規則）
- [x] 建立首份 ADR（資料流/狀態管理暫定方案）。
