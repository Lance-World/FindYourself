# Awareness Coordinate System｜Hybrid Mobile Version

> Original Idea by Lance

這是一套手機友善的覺察座標工具：

```text
GitHub Pages 前端
→ 本機規則立即判斷 X / Y / Z
→ Serverless AI 後端只負責文字整合
→ AI 失敗時仍保留本機結果
```

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
git commit -m "init awareness hybrid mobile"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

到 GitHub Repo：

```text
Settings → Pages → Deploy from branch → main / root → Save
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

## 設計原則

### 1. 本機先判斷

手機端立即產生：

```text
X 軸：問題規模
Y 軸：意識維度
Z 軸：整合程度
主卡片
相近位置
身體 / 心理 / 高我提醒
```

### 2. AI 只做文字整合

AI 不主控整個結果，只根據本機結果補充：

```json
{
  "summary": "...",
  "coordinate_reason": {
    "x": "...",
    "y": "...",
    "z": "..."
  },
  "suggestions": ["...", "...", "..."],
  "higher_self": "...",
  "caution": "..."
}
```

### 3. AI 失敗不影響使用

若 Serverless API、CORS 或 AI Provider 出錯，前端仍顯示本機結果。

## 手機安裝成 App

在手機瀏覽器打開 GitHub Pages 網址：

- iPhone Safari：分享 → 加入主畫面
- Android Chrome：選單 → 加到主畫面

## 隱私

- 使用者輸入會在本機規則中處理。
- 若有設定 AI 後端，輸入內容與本機座標會送到你的 Serverless Function，再送到 AI Provider。
- 歷史紀錄只存在瀏覽器 localStorage。
- API key 不放在前端。

## 免責聲明

本工具僅作為自我覺察與生活反思輔助，不是心理諮商、醫療診斷或治療建議。若使用者有嚴重情緒困擾或安全風險，請尋求專業協助。
