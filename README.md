# Awareness Coordinate System

> Original Idea by Lance

A self-awareness positioning tool built on three axes — X (Problem Scale), Y (Consciousness Dimension), Z (Integration Level) — to help you find your current location and take the next step toward living freely.

## How to Use

1. Open `awareness-v5.html` in any modern browser, or deploy to GitHub Pages / Netlify / Vercel.
2. On first use, enter your Anthropic API key when prompted (stored locally in your browser only, never sent anywhere else).
3. Describe your current state in the text area and click **✦ 開始定位**.

## Getting an API Key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up / log in → API Keys → Create Key
3. Paste the key into the tool's key input field

## Deployment (GitHub Pages)

```bash
git init
git add .
git commit -m "init"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/awareness-coordinate.git
git push -u origin main
```

Then go to repo Settings → Pages → Source: main branch → Save.

## Privacy

- All records are stored **locally in your browser** (localStorage). Nothing is sent to any server except the Anthropic API call itself (your input text + API key).
- Your API key is stored in `localStorage` and never transmitted anywhere except directly to `api.anthropic.com`.

## Disclaimer

This tool is for self-awareness purposes only and is **not related to any form of psychological counseling, medical diagnosis, or professional advice**.
