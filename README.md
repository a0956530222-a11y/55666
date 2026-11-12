# 報修登記系統
提供報修需求登記與查閱共用報修清單的功能。
雲端任務測試
- 欄位表與範例資料：[文件/報修欄位表.xlsx](文件/報修欄位表.xlsx)

## 網頁前端

根目錄的 `index.html`、`style.css`、`app.js`、`config.js` 是報修登記網頁，純 HTML/CSS/JavaScript，透過 CDN 載入 supabase-js v2。

- 發佈網址（GitHub Pages）：https://a0956530222-a11y.github.io/55666/
- `config.js` 只放 Supabase 網址與公開的 publishable key，不可放 secret 金鑰。
- 資料表與權限設定在 `supabase/schema.sql`，需先在 Supabase 的 SQL Editor 執行。

本機預覽：

```bash
python3 -m http.server 8000
```

再用瀏覽器開啟 http://localhost:8000/ 。

驗證方式：送出一筆虛構報修，確認畫面顯示「已送出報修」，且清單最上方出現這筆資料與自動產生的登記時間。
