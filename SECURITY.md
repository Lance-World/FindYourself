# Security Policy

## 核心原則

不要把任何 API key、token、cookie、secret 放進前端檔案：

```text
index.html
awareness-v5.html
css/*.css
js/*.js
GitHub public repo 內任何會被瀏覽器下載的檔案
```

前端靜態頁面的所有內容都會被使用者看到。只要金鑰放在前端，就等於公開。

## 正確 AI 架構

```text
Browser / GitHub Pages
→ Cloudflare Worker 或 Vercel Function
→ AI Provider
```

API key 應放在 Serverless 環境變數或 Secret，例如：

```text
GEMINI_API_KEY
OPENAI_API_KEY
ANTHROPIC_API_KEY
```

本專案範例預設使用：

```text
GEMINI_API_KEY
```

## CORS 建議

正式部署後，請設定：

```text
ALLOWED_ORIGIN = https://YOUR_USERNAME.github.io
```

避免任何網站都能呼叫你的 AI 後端。

## 濫用風險

若公開開放 Serverless URL，其他人仍可能直接呼叫你的後端。建議後續增加：

```text
每日請求上限
簡易 rate limit
Turnstile / CAPTCHA
匿名 session token
輸入字數限制
```

本版已包含：

```text
輸入長度限制 2800 字
固定 JSON 輸出
錯誤處理
不在前端存放 API key
```

## 推送前檢查

PowerShell：

```powershell
Select-String -Path .\* -Pattern "api_key|apikey|token|secret|cookie|Authorization|Bearer|ANTHROPIC_API_KEY|OPENAI_API_KEY|GEMINI_API_KEY" -CaseSensitive:$false -Recurse
```

如果結果出現在 `README.md` 或 `SECURITY.md` 的說明文字中，通常沒問題；若出現在 `.html`、`.js`、`.env`、設定檔或實際 key 值中，就不要 push。
