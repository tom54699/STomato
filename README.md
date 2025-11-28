# 番茄鐘學校積分 App

目前 repo 只保留 React + Vite 專案 `番茄鐘學校積分App/`。要在本機開發：

```bash
cd 番茄鐘學校積分App
npm install
npm run dev
```

## 分享 Demo（免安裝 server）

已提供兩個啟動腳本來快速執行 build 後的靜態檔：

- macOS/Linux：`./serve-demo.sh`
- Windows：`serve-demo.cmd`

腳本會使用 `npx serve build -l 4173` 啟動一個本機 HTTP server，跑起來後在瀏覽器開 `http://localhost:4173` 即可預覽。若要部署到網路主機，直接上傳 `番茄鐘學校積分App/build/` 即可。
