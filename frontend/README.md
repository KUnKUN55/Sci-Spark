# Student Portal - Headless Architecture

## 🚀 Deployment Guide

This is a modern headless architecture with:
- **Backend**: Google Apps Script (JSON API)
- **Frontend**: Static HTML/CSS/JS (hosted on Vercel/Netlify/GitHub Pages)

---

## 📁 Project Structure

```
StudentPortal/
├── Code-API.gs          # Backend API (deploy to GAS)
└── frontend/            # Frontend files (deploy to hosting)
    ├── index.html       # Student portal
    ├── admin.html       # Admin portal
    ├── css/
    │   └── styles.css   # Shared styles
    └── js/
        ├── config.js    # API configuration
        ├── api.js       # API client library
        ├── student.js   # Student portal logic
        └── admin.js     # Admin portal logic
```

---

## 🔧 Step 1: Deploy Backend (Google Apps Script)

### 1.1 Setup Google Sheets
1. Create a new Google Sheet
2. Go to **Extensions > Apps Script**
3. Delete the default `Code.gs` content
4. Copy **all content** from `Code-API.gs`
5. Paste into the Apps Script editor
6. Click **Run > setupSystem** to create database structure

### 1.2 Deploy as Web App
1. Click **Deploy > New deployment**
2. Select type: **Web app**
3. Settings:
   - **Execute as**: Me
   - **Who has access**: Anyone
4. Click **Deploy**
5. **Copy the deployment URL** (you'll need this!)

Example URL:
```
https://script.google.com/macros/s/AKfycbx.../exec
```

---

## 🌐 Step 2: Configure Frontend

### 2.1 Update API URL
1. Open `frontend/js/config.js`
2. Replace `YOUR_DEPLOYMENT_ID` with your actual deployment URL:

```javascript
const CONFIG = {
  API_URL: 'https://script.google.com/macros/s/YOUR_ACTUAL_ID/exec',
  MAX_FILE_SIZE: 10 * 1024 * 1024,
  TIMEOUT: 30000
};
```

---

## 🚀 Step 3: Deploy Frontend

Choose one of these free hosting options:

### Option A: Vercel (Recommended)

**Via CLI:**
```bash
npm i -g vercel
cd frontend
vercel
```

**Via Web:**
1. Go to [vercel.com](https://vercel.com)
2. Import the `frontend/` folder
3. Deploy!

### Option B: Netlify

**Drag & Drop:**
1. Go to [netlify.com](https://netlify.com)
2. Drag the `frontend/` folder to the deploy zone
3. Done!

**Via CLI:**
```bash
npm i -g netlify-cli
cd frontend
netlify deploy --prod
```

### Option C: GitHub Pages

```bash
cd frontend
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

Then enable GitHub Pages in repository settings.

---

## ✅ Step 4: Test Your Deployment

### Test Student Portal
1. Open your deployed frontend URL
2. Navigate to **Documents** tab
3. Try searching and filtering
4. Take a test exam

### Test Admin Portal
1. Open `https://YOUR_FRONTEND_URL/admin.html`
2. Add a test document
3. Create a test exam
4. Check the gradebook

---

## 🔒 Security Notes

### Current Setup (Public Access)
- ✅ Anyone can view and submit exams
- ✅ Good for classroom use
- ⚠️ No authentication required

### Adding Authentication (Optional)
To restrict access, modify `Code-API.gs`:

```javascript
function doGet(e) {
  const apiKey = e.parameter.key;
  if (apiKey !== 'YOUR_SECRET_KEY') {
    return createJsonResponse({ success: false, error: 'Unauthorized' });
  }
  // ... rest of code
}
```

Then update `frontend/js/config.js`:
```javascript
const CONFIG = {
  API_URL: 'https://script.google.com/macros/s/.../exec?key=YOUR_SECRET_KEY',
  // ...
};
```

---

## 🐛 Troubleshooting

### CORS Errors
- ✅ Already handled! We use `text/plain` content-type to avoid preflight
- If you still see errors, redeploy the GAS Web App

### API Not Responding
1. Check the deployment URL is correct in `config.js`
2. Ensure GAS Web App is deployed with "Anyone" access
3. Check Google Apps Script logs: **Executions** tab

### Files Not Loading
1. Open browser DevTools (F12)
2. Check Console for errors
3. Verify API URL in Network tab

### Exam Submissions Failing
- Check if exam status is "Open" in admin panel
- Verify student name is entered
- Check browser console for errors

---

## 📊 Performance

### Expected Performance
- **Page Load**: < 2 seconds
- **API Response**: < 1 second
- **Concurrent Users**: 10-15 easily

### Optimization Tips
1. **Images**: Use compressed images
2. **Caching**: Browser caches static files automatically
3. **CDN**: Vercel/Netlify use global CDNs

---

## 🎨 Customization

### Change Colors
Edit `frontend/css/styles.css`:
```css
:root {
  --accent: #2A2A2A;  /* Change to your brand color */
  --text-main: #1A1A1A;
  /* ... */
}
```

### Add New Subjects
Edit both:
1. `frontend/js/student.js` - `SUB_STYLE` object
2. `frontend/admin.html` - subject dropdown options

---

## 📝 License

Free to use for educational purposes.

---

## 🆘 Support

If you encounter issues:
1. Check browser console (F12)
2. Check GAS execution logs
3. Verify all URLs are correct
4. Test API endpoints with Postman

---

**Enjoy your new headless Student Portal! 🎉**
