# Hkayet Soura

A Lebanese storytelling card game, inspired by Dixit.

## Live URLs (once deployed on Vercel)
- **Game:** `https://hkayet-soura.vercel.app`
- **Admin portal:** `https://hkayet-soura.vercel.app/admin`

## Admin password
Default: `hkayet2024`
To change: edit line 5 of `src/AdminGate.jsx`

---

## How to update the game (from Claude)

1. Download the updated `hikaye.jsx` from Claude
2. Go to your GitHub repo → `src/App.jsx` → click pencil icon
3. Select all, paste the new code, commit
4. Vercel redeploys automatically in ~60 seconds

## How to update the admin portal (from Claude)

Same process but replace `src/Admin.jsx` with the updated `hikaye-admin.jsx`

---

## Project structure

```
hkayet-soura/
├── index.html          # Entry point (never changes)
├── package.json        # Dependencies (never changes)
├── vite.config.js      # Build config (never changes)
├── vercel.json         # Routing config (never changes)
└── src/
    ├── main.jsx        # Router: / → game, /admin → admin (never changes)
    ├── App.jsx         # ← THE GAME (update this from Claude)
    ├── Admin.jsx       # ← THE ADMIN PORTAL (update this from Claude)
    └── AdminGate.jsx   # Password protection (change password here)
```

## First-time setup

1. Create a GitHub account at github.com
2. Create a new repository called `hkayet-soura`
3. Upload all these files
4. Go to vercel.com, sign in with GitHub, import the repo
5. Deploy — done!
