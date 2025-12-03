# ADR-20251203: 前端狀態管理與資料流暫定方案（React → Flutter）

**狀態**: Proposed  
**日期**: 2025-12-03  
**決策人**: Codex（協作人：Claude）  

## 背景
- 現階段以 React 原型驗證功能與畫面；未接上後端，資料存於 local state + LocalStorage。
- 近期需求：累積番茄鐘、計畫列表、排程、統計、排行榜/社交構想，尚需通知、重複計畫、假排行榜等。
- 中期目標：將確認過的流程移植到 Flutter，並接後端 API 做雲端同步。

## 問題
如何在 React 原型期間保持資料流清晰、可測試，並為日後 Flutter + 後端同步留下可演進的界面契約？

## 選項
1) React 暫用「頁面內 useState + LocalStorage」，待 Flutter 重寫時再重構。  
2) React 引入全域狀態（Redux/Zustand）+ 型別化資料模型，並定義 API DTO，Flutter 可重用資料契約。  
3) 直接在 React 上仿 Flutter 架構（分層 + useReducer），以減低遷移成本。  

## 決策
- 採 **選項 2 的輕量版本**：  
  - React：以「頂層 Context + 自訂 hook」集中狀態，LocalStorage 作持久層。避免每頁各自管理資料。  
  - 型別：統一 `StudyPlan`, `FocusLog`, `User`, `LeaderboardEntry` 等 TypeScript 介面（已在 notes/2025-12-03-claude.md 與 ui/README.md 有欄位，可抽成 `src/types.ts`）。  
  - I/O：所有資料存取經過「存取介面」封裝（如 `useStudyPlans()` 內部負責序列化/驗證），方便未來替換成 API。  
  - 資料校驗：新增 schema（建議 Zod）在入/出時驗證，確保 LocalStorage 與未來 API 一致。  
- Flutter 前瞻：目標使用 **Riverpod**（或 Bloc 次選）作狀態管理；DTO 與 React 共享欄位命名與意義，減少後端/前端契約轉換成本。  

## 影響
- 優點：  
  - React 原型的狀態集中、可測試；未來可替換資料來源為 API 而不改 UI。  
  - 型別/DTO 一致性可直接作為後端 swagger/schema 的草稿。  
  - LocalStorage 邏輯集中，易於加入匯出/匯入與版本遷移。  
- 缺點：  
  - 需抽出 hook/context 並小幅重構現有頁面。  
  - 引入 Zod/型別校驗會增加少量包大小與樣板碼。  

## 待辦
- [ ] 抽出 `src/types.ts` 定義核心模型（StudyPlan/FocusLog/User/LeaderboardEntry/Achievement）。  
- [ ] 實作 `src/state/studyPlans.ts`、`src/state/focusLogs.ts` 等 hook/context，封裝 LocalStorage CRUD。  
- [ ] 加入 Zod schema 做入/出驗證與簡易 migration（版本號存在 LocalStorage）。  
- [ ] 撰寫單元測試：累積追蹤、自動完成、時間衝突、資料序列化。  
- [ ] Flutter 端 PoC：用同欄位 DTO + Riverpod 建立示範 provider，驗證契約可重用。  
