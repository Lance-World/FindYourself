# Security Policy

## API Key 原則

請不要把任何 API key、token、cookie、secret 放進：

- `awareness-v5.html`
- `index.html`
- `app.js`
- GitHub public repo 內任何前端檔案

前端靜態頁面的所有內容都會被瀏覽器使用者看到。只要金鑰放在前端，就等於公開。

## 建議 AI 架構

若需要外部 AI 分析，請使用後端代理：

```text
Browser → Backend / Serverless Function → AI Provider
```

API key 應放在後端環境變數，例如：

- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `GEMINI_API_KEY`

## 本版資料儲存

本版只使用瀏覽器 `localStorage` 儲存紀錄。

- 不上傳到外部伺服器
- 不跨裝置同步
- 清除瀏覽器資料後，紀錄會消失

## 推送前檢查

推送 GitHub 前，建議搜尋以下敏感字：

```text
api_key
apikey
token
secret
cookie
Authorization
Bearer
ANTHROPIC_API_KEY
OPENAI_API_KEY
GEMINI_API_KEY
```

PowerShell 範例：

```powershell
Select-String -Path .\* -Pattern "api_key|apikey|token|secret|cookie|Authorization|Bearer|ANTHROPIC_API_KEY|OPENAI_API_KEY|GEMINI_API_KEY" -CaseSensitive:$false -Recurse
```
