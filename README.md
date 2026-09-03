# Minimal Todo

一個簡潔的瀏覽器待辦清單 MVP。使用原生 HTML、CSS 與 JavaScript 製作，不需要安裝套件或啟動建置工具。

## 功能

- 新增待辦事項
- 雙擊待辦文字進行編輯
- 標記完成或取消完成
- 刪除待辦事項
- 顯示未完成數量
- 使用瀏覽器 `localStorage` 保存清單
- 支援桌面與行動版畫面

## 使用方法

直接用瀏覽器開啟 `index.html` 即可使用。

若要修改既有項目，雙擊待辦文字，輸入新內容後按 `Enter` 或點擊其他位置儲存；按 `Escape` 可取消編輯。

也可以在專案目錄啟動簡易靜態伺服器：

```bash
python -m http.server 8000
```

然後前往 `http://localhost:8000`。

## 專案結構

```text
todo-mvp/
├── index.html
├── styles.css
├── app.js
├── README.md
└── LICENSE
```

## 限制

- 資料只保存在目前瀏覽器，不會跨裝置同步。
- 沒有帳號、後端、分類、期限、搜尋或多人協作功能。
