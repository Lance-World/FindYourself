# Awareness Coordinate System｜Hybrid Mobile Version v2

> Original Idea by Lance

這是一套手機友善的覺察座標工具。新版依照「夢幻星空、柔和紫粉藍、玻璃卡片」方向重整版面，並把結果改成三張主要卡片：

```text
1. XYZ 綜合定位卡
2. 身心靈整合卡
3. AI 延伸輔助卡
```

核心架構仍然是：

```text
GitHub Pages 前端
→ 本機規則立即判斷 X / Y / Z
→ Serverless AI 後端只負責文字整合
→ AI 失敗或未設定時仍保留本機結果
```

## 本版重點

- XYZ 不再分散成多張小卡，而是合併成一張「XYZ 綜合定位卡」。
- 身體、心理、高我提醒整合成一張「身心靈整合卡」。
- AI 狀態改為「AI 輔助可選」，未設定時不視為錯誤。
- AI 延伸輔助固定是一張卡；未設定時會顯示設定提示。
- 座標 SVG 已加上內框，X / Y / Z 軸與標籤都收在框架內。
- 配色改為夢幻星空、紫粉、淺藍、暖金、柔綠的玻璃擬態風格。
- Service Worker cache 已升級為 `awareness-hybrid-mobile-v2`，避免手機載到舊 CSS / JS。

## 檔案結構

```text
awareness-hybrid-mobile/
├─ index.html
├─ awareness-v5.html              # 舊連結相容，會轉到 index.html
├─ manifest.json                  # PWA 設定
├─ sw.js                          # 基礎離線快取
├─ css/
│  └─ style.css
├─ js/
│  ├─ cards-db.js                 # 343 座標卡片生成與相近卡邏輯
│  ├─ local-analyzer.js           # 本機語義規則判斷
│  ├─ ai-client.js                # 前端呼叫 Serverless AI URL
│  └─ app.js                      # UI、歷史紀錄、座標圖、PWA
├─ api/
│  ├─ cloudflare-worker.js        # Cloudflare Worker 後端
│  └─ vercel-analyze.js           # Vercel Function 後端範例
├─ assets/
│  └─ icon.svg
├─ SECURITY.md
└─ .gitignore
```

## 本機測試

在資料夾內執行：

```powershell
python -m http.server 8000
```

打開：

```text
http://localhost:8000
```

不設定 AI 也可以使用；此時會使用本機規則判斷。

## 部署到 GitHub Pages

```powershell
git init
git add .
git commit -m "update awareness hybrid mobile v2"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

到 GitHub Repo：

```text
Settings → Pages → Deploy from branch → main / root → Save
```

若手機仍看到舊版，請清除瀏覽器快取，或在網址後面加：

```text
?v=2
```

## AI 後端方案 A：Cloudflare Worker

1. 建立 Cloudflare Worker。
2. 將 `api/cloudflare-worker.js` 貼到 Worker。
3. 設定 Secret：

```text
GEMINI_API_KEY = 你的 Gemini API Key
```

4. 可選變數：

```text
GEMINI_MODEL = gemini-2.0-flash
ALLOWED_ORIGIN = https://YOUR_USERNAME.github.io
```

5. 部署後取得 Worker URL，例如：

```text
https://your-worker.your-name.workers.dev/api/analyze
```

6. 回到前端頁面 → AI 設定 → 貼上 Serverless API URL。

## AI 後端方案 B：Vercel Function

若整個專案改部署到 Vercel，請把：

```text
api/vercel-analyze.js
```

放成：

```text
api/analyze.js
```

然後在 Vercel Project Settings → Environment Variables 設定：

```text
GEMINI_API_KEY = 你的 Gemini API Key
GEMINI_MODEL = gemini-2.0-flash
ALLOWED_ORIGIN = https://YOUR_USERNAME.github.io
```

前端 AI URL 填：

```text
https://your-vercel-project.vercel.app/api/analyze
```

## 隱私

- 使用者輸入會先在本機規則中處理。
- 若有設定 AI 後端，輸入內容與本機座標會送到你的 Serverless Function，再送到 AI Provider。
- 歷史紀錄只存在瀏覽器 localStorage。
- API key 不放在前端。

## 免責聲明

本工具僅作為自我覺察與生活反思輔助，不是心理諮商、醫療診斷或治療建議。若使用者有嚴重情緒困擾或安全風險，請尋求專業協助。
