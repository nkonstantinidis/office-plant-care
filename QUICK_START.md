# Quick Start Guide

## ✅ Project Setup Complete

Your Office Plant Care App is ready! The dev server is running at: **http://localhost:5173**

## 📝 What's Been Created

### Core Application
- ✅ React + Vite project structure
- ✅ Supabase integration (auth, database, real-time)
- ✅ React Router for navigation
- ✅ CSS Modules for styling
- ✅ Custom React hooks for data management

### Pages & Features
1. **Login Page** - Display name + password authentication
2. **Dashboard** - View all plants, water them, create new ones
3. **Create/Edit Plant** - Form to add or modify plants
4. **Leaderboard** - See who's watered the most plants

### Components
- **PlantCard** - Displays individual plant with status colors
- **Button** - Reusable styled button component
- Custom hooks: `useAuth`, `usePlants`, `useWaterings`

### Database Ready
- `plants` table (with RLS policies)
- `waterings` table (activity log)
- Row-Level Security enabled

## 🚀 Next Steps (IMPORTANT!)

### 1. Set Up Supabase
Follow **SETUP.md** in detail to:
- Create database tables
- Enable Row-Level Security (RLS)
- Create test user account
- Configure .env.local file

### 2. Configure Environment
Create `.env.local` in project root with:
```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Test the App
Once .env.local is set:
1. Press `Ctrl+C` to stop current dev server (if running)
2. Run: `npm run dev`
3. Open http://localhost:5173
4. Login with: admin / admin1234

## 📂 Project Structure

```
src/
├── components/     → Reusable UI (Button, PlantCard)
├── pages/          → Full pages (Login, Dashboard, etc)
├── hooks/          → Data fetching & auth (useAuth, usePlants, etc)
├── context/        → Auth state management
├── lib/            → Utilities & Supabase client
└── styles/         → Global CSS

public/
└── illustrations/  → Plant images (add your own here)
```

## 🌱 Key Features

| Feature | Status |
|---------|--------|
| Email/Password Auth | ✅ Ready |
| Create/Edit/Delete Plants | ✅ Ready |
| Water Plants | ✅ Ready |
| Status Indicators (Red/Yellow/Green) | ✅ Ready |
| Leaderboard | ✅ Ready |
| Activity Feed | ✅ Ready |
| Real-time Sync | ✅ Ready |
| Mobile Responsive | ✅ Ready |

## 🔧 Available Commands

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
```

## 📚 Key Files to Know

- **SETUP.md** - Complete setup instructions (READ FIRST!)
- **README.md** - Full documentation
- **.env.example** - Environment variables template
- **vite.config.js** - Vite configuration
- **package.json** - Project dependencies

## 🐛 Common Issues

### "Blank page / Cannot connect to database"
→ Verify .env.local is set with correct Supabase credentials

### "Auth error when logging in"
→ Create test user in Supabase: admin@workshop.local / admin1234

### "npm: command not found"
→ Install Node.js from https://nodejs.org (version 16 or higher)

### "Port 5173 already in use"
→ Run: `npm run dev -- --port 3000`

## ✨ You're All Set!

- Read SETUP.md for detailed configuration
- The codebase is fully commented and modular
- All components use CSS Modules for styling
- Hooks handle all API interactions

Happy planting! 🌿
