# Khata — Expense AI Assistant

A friendly, lightweight personal expense tracker with mock AI flows: Gmail
receipt scanning, bank/credit-card statement upload, WhatsApp invoice parsing,
AI categorization, monthly reports, and cash-flow forecasting. Built with React,
Vite, Recharts, and lucide-react. All data is mock/in-memory.

## Run locally

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

## Host it on your own GitHub (GitHub Pages)

This repo ships with a GitHub Actions workflow (`.github/workflows/deploy.yml`)
that builds the app and publishes it to GitHub Pages automatically.

1. Create a new **empty** repository on github.com (no README/.gitignore).
2. From this folder, push the code:

   ```bash
   git init
   git add .
   git commit -m "Khata expense assistant"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```

3. On GitHub: **Settings → Pages → Build and deployment → Source = GitHub Actions**.
4. The "Deploy to GitHub Pages" action runs on push. When it finishes (green
   check under the **Actions** tab), your site is live at:

   ```
   https://<your-username>.github.io/<your-repo>/
   ```

Every future `git push` to `main` redeploys automatically.

> The `base: "./"` setting in `vite.config.js` uses relative asset paths, so the
> build works under any repo name without edits.
