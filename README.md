# UI 原型追蹤

## 角色分工
- Claude：`src/` 內所有畫面與互動原型。
- Codex：記錄變更、任務與決策；不改 `src/`。

## 畫面狀態（2025-12-03）
- Home（番茄鐘主畫面）
  - 完成：圓環可調時間；開始按鈕跟隨圓環值；累積番茄鐘追蹤（targetMinutes/completedMinutes/pomodoroCount）；自動完成判定。
  - 缺口：通知/音效；時區與資料驗證；長期儲存策略。
- StudyPlanner
  - 完成：時長與開始時間下拉選單 UI 改版（漸層、emoji、衝突提示）；基本計畫列表。
  - 缺口：重複計畫、模板/複製、標籤分類；時間衝突邏輯需要測試。
- Insights
  - 完成：計畫分析區塊新增。
  - 缺口：真實統計來源；週/月報告與視覺化。
- Settlement
  - 完成：微調樣式。
  - 缺口：與計畫/成就的對齊與資料來源。
- Login
  - 狀態：尚未串接認證；仍為原型。
- Leaderboard / Social Challenge / Progress
  - 狀態：資料來源與排序規則未定；需定義 API/資料欄位。

## 資料/Mock 狀態
- StudyPlan 型別新增欄位：`targetMinutes`, `completedMinutes`, `pomodoroCount`（支援累積追蹤）。
- Mock/LocalStorage key：`currentUser`, `studyPlans`, `focusLogs-{userId}`。
- 建議：變更 mock 欄位時在此檔補充一行並同步日誌。

## 標記方式
- Claude 每次作業後於 `notes/<date>-claude.md` 記錄改動，並同步更新此檔的完成度/缺口。
- 本檔維持「最新真相」，避免重複或過期資訊。
