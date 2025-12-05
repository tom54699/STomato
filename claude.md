# Insights 頁面重新設計 - 完整說明

## 專案概述

本次重新設計移除了硬編碼的月度目標，改為提供全面的數據驅動統計分析，包含三大摘要卡片（週度/月度/全歷程）、可展開的趨勢分析區塊，以及根據使用行為產生的智慧建議。

## 資料來源

### FocusLog（專注記錄）
- **欄位**：id, date, minutes, timestamp, planId, planTitle, subject, location
- **儲存位置**：localStorage (`focusLogs`)
- **用途**：記錄每次完成的番茄鐘時長和相關資訊

### StudyPlan（讀書計畫）
- **欄位**：id, title, subject, date, startTime, endTime, completed, targetMinutes, completedMinutes, pomodoroCount
- **儲存位置**：localStorage (`studyPlans`)
- **用途**：規劃和追蹤學習計畫的完成狀況

## 核心功能實作

### 1. 月度統計 (monthStats)

**位置**：`src/components/Insights.tsx` 第 86-126 行

**計算邏輯**：
- 取得當月第一天和最後一天
- 建立每日資料地圖（用於熱力圖）
- 計算總分鐘數、總番茄鐘數、活躍天數
- 計算日均時長（僅計算有記錄的天數）
- 找出最佳單日表現

**返回資料**：
```typescript
{
  totalMinutes: number,        // 本月累積分鐘
  totalPomodoros: number,      // 本月累積番茄鐘
  activeDays: number,          // 活躍天數
  dailyAverage: number,        // 日均時長
  bestDay: {                   // 最佳單日
    day: number,
    minutes: number,
    sessions: number
  },
  dailyData: Array<{           // 每日資料（用於熱力圖）
    date: string,
    day: number,
    minutes: number,
    sessions: number
  }>,
  daysInMonth: number          // 本月天數
}
```

**熱力圖設計**：
- 0 次：灰色 (bg-gray-100)
- 1-2 次：淺橙色 (bg-orange-200)
- 3-4 次：中橙色 (bg-orange-400)
- 5+ 次：深橙色 (bg-orange-600)

### 2. 全歷程統計 (lifetimeStats)

**位置**：`src/components/Insights.tsx` 第 128-199 行

**計算邏輯**：

#### 連續天數計算
- 取得所有有記錄的日期，排序後計算日期間隔
- 若間隔為 1 天則連續天數 +1
- 若間隔 > 1 天則重置為 1
- 記錄最長連續天數

#### 最佳單日
- 建立日期對應的分鐘數和次數地圖
- 找出分鐘數最多的那一天

#### 最佳單週
- 使用 7 天滾動窗口
- 計算每個窗口的總分鐘數
- 記錄最高的那一週

**返回資料**：
```typescript
{
  totalPomodoros: number,      // 總番茄鐘數
  totalMinutes: number,        // 總分鐘數
  longestStreak: number,       // 最長連續天數
  bestDay: {                   // 最佳單日
    date: string,
    minutes: number,
    sessions: number
  },
  bestWeekMinutes: number,     // 最佳單週分鐘數
  bestWeekStart: string        // 最佳週起始日期
}
```

### 3. 週度比較 (weekComparison)

**位置**：`src/components/Insights.tsx` 第 201-240 行

**計算邏輯**：
- **本週**：最近 7 天（今天往前推 0-6 天）
- **上週**：前一個 7 天（今天往前推 7-13 天）
- 計算分鐘數和次數的百分比變化（Δ%）
- 特殊處理：上週為 0 時，本週有記錄則顯示 +100%

**公式**：
```
Δ% = ((本週 - 上週) / 上週) × 100
```

**返回資料**：
```typescript
{
  currentMinutes: number,      // 本週分鐘數
  currentSessions: number,     // 本週次數
  minutesDelta: number,        // 分鐘數變化百分比
  sessionsDelta: number,       // 次數變化百分比
  activeDays: number           // 本週活躍天數
}
```

### 4. 完成品質分析 (qualityStats)

**位置**：`src/components/Insights.tsx` 第 242-272 行

**計算邏輯**：

#### 時長分類
- **短期**：< 20 分鐘（可能被中斷）
- **標準**：20-30 分鐘（符合番茄鐘標準）
- **長期**：> 30 分鐘（超額完成）

#### 品質指標
- **完成率**：(標準 + 長期) / 總次數 × 100%
- **中斷率**：短期 / 總次數 × 100%
- **平均時長**：總分鐘數 / 總次數

**返回資料**：
```typescript
{
  avgDuration: number,         // 平均時長
  completionRate: number,      // 完成率 (%)
  interruptionRate: number,    // 中斷率 (%)
  shortSessions: number,       // 短期次數
  standardSessions: number,    // 標準次數
  longSessions: number         // 長期次數
}
```

### 5. 智慧建議 (dynamicSuggestions)

**位置**：`src/components/Insights.tsx` 第 348-415 行

**建議邏輯**：

#### 1. 連續天數建議
- **0 天**：「今天還沒有紀錄，開始一個番茄鐘延續學習習慣！」
- **3-6 天**：「🔥 已連續 X 天！再堅持 Y 天達成一週連續目標」
- **7+ 天**：「🏆 太棒了！已連續 X 天，保持這個勢頭！」

#### 2. 活躍度建議
- **活躍率 < 50%**：「本月活躍天數僅 X%，試著每天至少完成 1 個番茄鐘」
- **活躍率 ≥ 80%**：「🌟 本月活躍度極高（X%），繼續保持！」

#### 3. 時段效率建議
- 計算早上/下午/晚上的完成率
- 找出完成率最高的時段
- **完成率 > 70%**：「你在X的完成率最高（Y%），建議優先安排重要任務」

#### 4. 品質建議
- **中斷率 > 30% 且記錄 ≥ 5 次**：「最近中斷率較高（X%），試著減少外部干擾或調整番茄鐘時長」

**返回資料**：最多 3 條建議的陣列

## UI 架構

### 專注趨勢分頁

#### 1. 空狀態提示
**條件**：`logs.length === 0`
- 顯示番茄鐘圖示
- 引導文字：「開始你的第一個番茄鐘」
- 說明：「完成番茄鐘後，這裡會顯示詳細的統計與分析」

#### 2. 摘要卡片（永遠可見）

##### 本週概況卡片
- 專注分鐘數 + Δ% 對比
- 番茄鐘數 + Δ% 對比
- 本週活躍天數 / 7 天
- **顏色**：
  - 增長：綠色 (text-green-600)
  - 下降：紅色 (text-red-600)

##### 本月統計卡片
- 累積番茄鐘數
- 累積分鐘數
- 日均時長
- 最佳單日表現
- **月度熱力圖**：
  - 7×N 網格顯示每日活躍度
  - 顏色強度反映番茄鐘數量
  - Hover 顯示詳細資訊

##### 全歷程統計卡片
- 總番茄鐘數
- 總分鐘數
- 🔥 最長連續天數（特別強調）
- 最佳單日表現
- 最佳單週表現

#### 3. 可展開區塊（預設收合）

##### 完成品質分析
- **觸發**：點擊標題展開/收合
- **內容**：
  - 完成率、中斷率、平均時長
  - 時長分布（短期/標準/長期）

##### 最投入科目 Top 5
- **標題**：改為「最投入科目 Top 5」
- **footer**：「顯示學習時長最多的科目」
- 漸層條狀圖顯示前 5 名科目

##### 時段分析
- 早上/下午/晚上的分布統計

##### 累積進度
- 總體累積數據

#### 4. 智慧建議區（永遠可見）
- 顯示 2-3 條根據行為分析產生的建議
- 空狀態：「完成 1 個番茄鐘來解鎖個人化建議」

#### 5. 成就徽章
- 保持原有設計

## 關鍵設計決策

### 1. 去除硬編碼目標
**原因**：硬編碼的月度目標無法適應不同使用者的需求

**解決方案**：
- 改用累積統計
- 透過 Δ% 顯示進步趨勢
- 用連續天數和活躍度引導使用者

### 2. 資料驅動的建議系統
**原因**：通用建議缺乏個人化

**解決方案**：
- 分析連續天數、活躍度、時段效率、完成品質
- 根據實際數據產生 2-3 條最相關的建議
- 正向激勵為主

### 3. 視覺化層次設計
**原因**：避免資訊過載

**解決方案**：
- **永遠可見**：摘要卡片、智慧建議（最重要）
- **可展開**：詳細分析、分布統計（次要）
- **條件顯示**：空狀態、無資料區塊

### 4. 週度 Δ% 計算
**特殊處理**：
- 上週為 0、本週有記錄 → 顯示 +100%（避免除以零）
- 本週為 0、上週有記錄 → 顯示 -100%
- 兩週都為 0 → 顯示 0%

## 邊界情況處理

### 1. 無資料狀態
- `logs.length === 0`：顯示空狀態引導
- `lifetimeStats.totalPomodoros === 0`：Lifetime 卡片顯示「尚無歷史紀錄」

### 2. 日期計算
- 使用 `toISOString().split('T')[0]` 確保時區一致性
- 閏年二月自動處理（使用 Date API）

### 3. 連續天數計算
- 考慮今天尚未記錄的情況
- 從今天往回推，找到第一個沒有記錄的日期

### 4. 週度比較
- 確保「本週」和「上週」定義清晰（7 天固定窗口）
- 處理專案剛開始使用，沒有「上週」資料的情況

## 效能最佳化

### useMemo 使用
所有統計計算都使用 `useMemo` 快取：
- 依賴 `logs` 陣列變化才重新計算
- 避免每次 render 都重複計算

### 計算複雜度
- `monthStats`：O(n) - 單次遍歷
- `lifetimeStats`：O(n log n) - 排序後遍歷
- `weekComparison`：O(n) - 兩次過濾
- `qualityStats`：O(n) - 分類統計
- `dynamicSuggestions`：O(n) - 參考其他已計算的 stats

## 測試建議

### 功能測試
1. **空狀態**：清空 localStorage，確認顯示引導訊息
2. **單一記錄**：新增 1 筆記錄，確認所有統計正常
3. **連續天數**：新增連續多天記錄，驗證 streak 計算
4. **中斷連續**：新增有間隔的記錄，驗證 streak 重置
5. **月底/月初**：測試跨月情況
6. **閏年二月**：測試 2 月 29 日

### 邊界測試
1. 上週無資料、本週有資料 → Δ% = +100%
2. 所有記錄都 < 20 分鐘 → 完成率 = 0%, 中斷率 = 100%
3. 資料跨越多年 → 確保 lifetime stats 正確

### 效能測試
1. 1000+ 筆記錄的載入速度
2. 展開/收合區塊的流暢度

## 檔案清單

### 主要檔案
- `/Users/myaninnovation/Documents/Tomato/tomato/src/components/Insights.tsx`
  - 新增計算函數：monthStats, lifetimeStats, weekComparison, qualityStats, dynamicSuggestions
  - 更新 UI：3 張摘要卡片 + 品質分析區塊 + 空狀態
  - 更新狀態：expandedSections 新增 quality 欄位

### 相關檔案
- `/Users/myaninnovation/Documents/Tomato/tomato/src/components/Home.tsx`
  - FocusLog 的新增邏輯參考
- `/Users/myaninnovation/Documents/Tomato/tomato/src/components/StudyPlanner.tsx`
  - 日期處理方式參考

## 未來擴充建議

### 1. 導出功能
- 匯出為 CSV/PDF 報表
- 自訂日期區間

### 2. 目標設定
- 允許使用者自訂月度/週度目標
- 目標達成提醒

### 3. 科目深度分析
- 每個科目的學習曲線
- 科目間的時間分配建議

### 4. 社交功能
- 排行榜
- 好友比較

### 5. 進階統計
- 學習效率分析（完成分鐘 / 計畫分鐘）
- 拖延指數（實際開始時間 vs 計畫時間）

## 版本記錄

### v2.0.0 (2025-12-05)
- ✅ 移除硬編碼月度目標
- ✅ 新增月度統計 + 熱力圖
- ✅ 新增全歷程統計 + 連續天數追蹤
- ✅ 新增週度 Δ% 比較
- ✅ 新增完成品質分析
- ✅ 實作智慧建議系統
- ✅ 重新設計 UI 層次（摘要卡片 + 可展開區塊）
- ✅ 新增空狀態處理
- ✅ 更新科目分布區塊命名

---

**文件建立日期**：2025-12-05
**最後更新**：2025-12-05
**維護者**：Claude Code
