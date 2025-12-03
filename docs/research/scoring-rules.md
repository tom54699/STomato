# 番茄鐘積分規則（現狀摘要） — React 原型

來源：`src/components/Home.tsx`, `src/components/Settlement.tsx`, `src/App.tsx`（2025-12-03 版本）

## 核心規則
- **基礎累積**：計時進行且頁面可見時，每分鐘 +10 分。
- **背景扣分**：計時時若頁面轉為背景（`document.hidden`），立即扣分 `penalty = min(50, 已累積分)`，並暫停累積；回到前景才恢復。
- **完成獎勵**：一輪結束（倒數到 0）時額外 +50 分；本次總分 = 過程累計 + 50。
- **總積分更新**：`updateUserPoints` 將本次總分加到 `currentUser.totalPoints`，存回 LocalStorage。
- **與計畫關聯**：若綁定某計畫，完成時：
  - `completedMinutes += initialMinutes`
  - `pomodoroCount += 1`
  - 若 `completedMinutes >= targetMinutes` 則 `completed = true`

## 結算等級（Settlement）
- 150+：完美！ ⭐ （from yellow-400 to orange-500）
- 100–149：太棒了！ 🌟
- 50–99：不錯喔 👍
- 0–49：加油！ 💪

## 未實作 / 空白區
- 連擊/連勝加成、任務權重、難度係數
- 排行榜/社交計分規則
- 成就/徽章條件（僅構想）
- 休息長度對分數影響、每日上限/懲罰
- 後端同步與反作弊（時間驗證、離線補報）

> 本檔僅描述現有邏輯，未決定未來是否修改。若調整，請同步更新此檔並在 ADR 紀錄決策。
