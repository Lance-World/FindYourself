# 覺察座標系統 3D 地圖

這是一個可部署於 GitHub Pages 的單頁靜態網站，用於輸入當下狀態後，產生 X / Y / Z 三軸覺察定位、相近情境、身體/心理/靈性三面向建議，以及本機紀錄。

## 檔案

- `awareness-v5.html`：主程式頁面，檔名維持不變。
- `index.html`：GitHub Pages 根目錄導向頁，會自動轉到 `awareness-v5.html`。
- `SECURITY.md`：資安與 API key 注意事項。
- `.gitignore`：避免把金鑰、環境檔、暫存檔推上 GitHub。

## 重要修正

原始版本在 GitHub Pages 可能出現空白頁，常見原因包含：

1. 前端直接呼叫 Anthropic API，容易遇到 CORS、API key、瀏覽器安全限制。
2. 使用 `window.storage`，但 GitHub Pages 沒有這個物件。
3. JavaScript 初始化階段若中斷，頁面可能只顯示空白。

本版修正：

- 改用 `localStorage` shim，相容 GitHub Pages。
- 移除前端直連 Anthropic API。
- 改成本機規則分析，讓網站即使沒有後端也能使用。
- 加上錯誤提示，避免無聲失敗。

## 部署方式

### 方法 A：GitHub Pages 根目錄部署

把以下檔案放到 repo 根目錄：

```text
awareness-v5.html
index.html
README.md
SECURITY.md
.gitignore
```

GitHub Pages 設定：

- Source：Deploy from branch
- Branch：main
- Folder：/root

網站根目錄會自動導向：

```text
https://你的帳號.github.io/你的repo/awareness-v5.html
```

### 方法 B：只更新主頁檔案

如果你已經有 GitHub Pages 架構，只要覆蓋：

```text
awareness-v5.html
```

但若希望 repo 首頁自動開啟此頁，仍建議保留 `index.html`。

## AI 功能說明

目前版本採用安全的本機規則分析，不需要 API key，也不會把輸入送到外部伺服器。

若未來要恢復真正 AI 分析，請不要在 `awareness-v5.html` 內放 API key。建議架構是：

```text
Browser → Serverless Function / Backend Proxy → AI API
```

可選方案：

- Cloudflare Workers
- Vercel Serverless Functions
- Netlify Functions
- 自架 Node.js / Python API

前端只呼叫你自己的後端 endpoint，API key 放在後端環境變數。

## 本機測試

建議不要直接雙擊 HTML，而是用 local server：

```powershell
python -m http.server 8000
```

再開啟：

```text
http://localhost:8000/awareness-v5.html
```
