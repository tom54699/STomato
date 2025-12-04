# 設計 Tokens 草稿（React → Flutter 共用色票/尺寸參考）

目的：讓 React 原型與未來 Flutter 移植共享顏色/間距/圓角/陰影的對照，不改動現有 UI。

## 色票（HEX）
- 主色：`#030213`；主文字反色：`#FFFFFF`
- 灰階：50 `#f8f9fb` · 100 `#f0f1f7` · 200 `#e5e7ee` · 300 `#d1d5dc` · 400 `#a4acb8` · 500 `#75849a` · 600 `#5b6478` · 700 `#3f4560` · 800 `#2d3043`
- 藍/靛：blue50 `#f2f6ff` · blue400 `#5f8dff` · blue500 `#4b6dff` · indigo50 `#f3f2ff` · indigo500 `#4c63ff`
- 紫/粉：purple400 `#7b63ff` · purple500 `#6840ff` · pink400 `#eb5fa0` · pink500 `#e94a9e`
- 橘/黃/綠：orange400 `#ec8a4d` · orange500 `#e0723a` · yellow400 `#eecb5c` · green500 `#3fcf82`

## 間距（px）
- xs 4 · sm 8 · md 12 · lg 16 · xl 20 · 2xl 24 · 3xl 32

## 圓角（px）
- sm 8 · md 10 · lg 12 · xl 16 · 2xl 16 · 3xl 24 （對應 Tailwind rounded-*）

## 陰影（示例）
- card: `0 10px 30px rgba(0,0,0,0.08)`
- soft: `0 6px 20px rgba(0,0,0,0.06)`

## 字體
- Font: `Inter, system-ui, -apple-system, sans-serif`
- 字級：xs 12 · sm 14 · base 16 · lg 18 · xl 20 · 2xl 24 · 4xl 36 · 6xl 60
- 粗細：regular 400 · medium 500

## 結算等級映射（僅紀錄，UI 仍在元件內）
- 150+：完美 ⭐，黃→橘漸層
- 100–149：太棒 🌟，橘→粉
- 50–99：不錯 👍，藍→靛
- 0–49：加油 💪，綠

> 此檔與 `src/design/tokens.ts` 同步；目前未接入 UI，避免影響現有畫面。後續重構可引用同名常數。***
