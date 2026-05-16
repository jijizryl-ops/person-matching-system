# 🏛️ Person Matching System
### Barangay Resident Management & Person Matching Portal

---

## 📋 Features
- ✅ Login system (Admin & Staff roles)
- ✅ Dashboard with stats & charts
- ✅ Add / Edit / Delete residents
- ✅ Search residents by physical description (Person Matching)
- ✅ Blotter / Incident records
- ✅ Print reports
- ✅ Google Sheets as database
- ✅ Deployable on GitHub Pages (FREE)

---

## 🚀 Setup Guide (Step by Step)

### STEP 1 — Create your Google Sheet

1. Go to [https://sheets.google.com](https://sheets.google.com)
2. Click **"Blank"** to create a new spreadsheet
3. Name it: **PersonMatch DB**
4. Copy the **Sheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/THIS_IS_YOUR_SHEET_ID/edit
   ```

---

### STEP 2 — Set up Google Apps Script

1. Go to [https://script.google.com](https://script.google.com)
2. Click **"New project"**
3. Delete everything in the editor
4. Open `apps-script.gs` from this project
5. **Paste the entire contents** into the Apps Script editor
6. Find this line and replace with your Sheet ID:
   ```js
   const SPREADSHEET_ID = 'YOUR_SHEET_ID_HERE';
   ```
7. Click **Save** (Ctrl+S)

---

### STEP 3 — Run setupSheets (creates headers + admin account)

1. In Apps Script, click the **function dropdown** (top toolbar)
2. Select **`setupSheets`**
3. Click **▶ Run**
4. Grant permissions when asked (click "Allow")
5. You should see: `✅ Sheets setup complete!` in the logs

---

### STEP 4 — Deploy as Web App

1. In Apps Script, click **Deploy** → **New deployment**
2. Click the gear ⚙️ next to "Type" → select **Web app**
3. Set:
   - **Description**: PersonMatch API
   - **Execute as**: Me
   - **Who has access**: Anyone
4. Click **Deploy**
5. Copy the **Web App URL** — looks like:
   ```
   https://script.google.com/macros/s/XXXXXXXXX/exec
   ```

---

### STEP 5 — Update config.js

Open `js/config.js` and replace:
```js
const CONFIG = {
  SCRIPT_URL: 'PASTE_YOUR_WEB_APP_URL_HERE',
  SHEET_ID:   'PASTE_YOUR_SHEET_ID_HERE',
};
```

---

### STEP 6 — Deploy to GitHub Pages

1. Go to [https://github.com](https://github.com)
2. Click **"New repository"**
3. Name it: `personmatch`
4. Set to **Public**
5. Click **Create repository**
6. Upload all project files
7. Go to **Settings** → **Pages**
8. Source: **Deploy from a branch** → `main` → `/ (root)`
9. Click **Save**
10. Your site will be live at:
    ```
    https://YOUR_GITHUB_USERNAME.github.io/personmatch
    ```

---

## 🔑 Default Login Credentials

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Administrator |

> ⚠️ Change the password after first login by editing the users sheet in Google Sheets directly.

---

## 📁 Project Structure

```
personmatch/
├── index.html          ← Login page
├── dashboard.html      ← Main app (all pages)
├── apps-script.gs      ← Google Apps Script backend
├── css/
│   └── style.css       ← All styles
├── js/
│   ├── config.js       ← YOUR GOOGLE SHEET CONFIG HERE
│   ├── sheets.js       ← Google Sheets API wrapper
│   ├── auth.js         ← Login / session management
│   └── app.js          ← Main app logic
└── README.md
```

---

## 💡 Tips

- **Google Sheets** acts as your database — you can view/edit data directly in the sheet
- **Session** is stored in browser sessionStorage — users are logged out when browser closes
- **Print reports** use the browser's built-in print dialog
- The system works on **mobile** too!

---

## 🛠️ Built With

- HTML5 + CSS3 + Vanilla JavaScript
- [Bootstrap 5](https://getbootstrap.com) (via CDN)
- [Chart.js](https://chartjs.org) — for dashboard charts
- [Google Sheets API](https://developers.google.com/sheets) — as database
- [Google Apps Script](https://script.google.com) — as backend
- [GitHub Pages](https://pages.github.com) — free hosting
