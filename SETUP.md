# 🌱 Office Plant Care App - Complete Setup Guide

## Overview

This is a Tamagotchi-style web app for taking care of office plants. Multiple people can share responsibility for watering plants in an office. The app tracks each plant's watering schedule and gamifies the experience with a leaderboard.

## Prerequisites

✅ Node.js 16+ installed  
✅ npm or yarn package manager  
✅ A Supabase account (free tier at https://supabase.com)  

## Step-by-Step Setup

### Step 1: Get Supabase Credentials

1. Go to https://supabase.com and sign up (free)
2. Create a new project
3. Go to **Settings** → **API** in your Supabase dashboard
4. Copy your:
   - **Project URL** (looks like: `https://xxx.supabase.co`)
   - **Anon Key** (the public API key)

### Step 2: Set Up Database Tables

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query" and paste this SQL:

```sql
-- Create plants table
CREATE TABLE public.plants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  plant_type TEXT NOT NULL,
  water_amount_ml INTEGER NOT NULL DEFAULT 200,
  watering_frequency INTEGER NOT NULL DEFAULT 3,
  sunlight_needs TEXT,
  location TEXT NOT NULL,
  illustration TEXT,
  last_watered_at TIMESTAMP WITH TIME ZONE,
  next_watering_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create waterings table for activity log
CREATE TABLE public.waterings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('red', 'yellow', 'green')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_plants_owner_id ON plants(owner_id);
CREATE INDEX idx_plants_next_watering ON plants(next_watering_at);
CREATE INDEX idx_waterings_plant_id ON waterings(plant_id);
CREATE INDEX idx_waterings_user_id ON waterings(user_id);
CREATE INDEX idx_waterings_created ON waterings(created_at DESC);
```

3. Click **Run**

### Step 3: Enable Row-Level Security (RLS)

1. Go to **SQL Editor** again
2. Create a new query and paste this:

```sql
-- Enable RLS
ALTER TABLE public.plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waterings ENABLE ROW LEVEL SECURITY;

-- Plants: Everyone can read
CREATE POLICY "Users can view all plants"
  ON public.plants
  FOR SELECT
  USING (true);

-- Plants: Anyone can create
CREATE POLICY "Authenticated users can create plants"
  ON public.plants
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND
    auth.uid() = owner_id
  );

-- Plants: Only owner can update
CREATE POLICY "Only owners can update their plants"
  ON public.plants
  FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Plants: Only owner can delete
CREATE POLICY "Only owners can delete their plants"
  ON public.plants
  FOR DELETE
  USING (auth.uid() = owner_id);

-- Waterings: Everyone can read
CREATE POLICY "Users can view all waterings"
  ON public.waterings
  FOR SELECT
  USING (true);

-- Waterings: Authenticated users can record waterings
CREATE POLICY "Authenticated users can record waterings"
  ON public.waterings
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND
    auth.uid() = user_id
  );
```

3. Click **Run**

### Step 4: Create Test User Account

1. In Supabase, go to **Authentication** → **Users**
2. Click **Create new user**
3. Fill in:
   - **Email:** `admin@workshop.local`
   - **Password:** `admin1234`
   - Check "Auto confirm user"
4. Click **Create user**

If your Supabase UI does not allow editing user metadata JSON directly, run this SQL instead:

```sql
UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"display_name":"admin"}'::jsonb
WHERE email = 'admin@workshop.local';
```

Then verify it was saved:

```sql
SELECT email, raw_user_meta_data
FROM auth.users
WHERE email = 'admin@workshop.local';
```

Note: The app still works even without `display_name` metadata because it falls back to the email prefix.

### Step 4.1: Required SQL Patch (names + cross-user watering)

If your project was created from the earlier setup, run this patch once in **SQL Editor**.

```sql
-- Public profile table used to show display names in cards and leaderboard.
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are readable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles are readable by authenticated users"
  ON public.profiles
  FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Backfill profiles from existing auth users.
INSERT INTO public.profiles (id, display_name, updated_at)
SELECT
  id,
  COALESCE(raw_user_meta_data->>'display_name', split_part(email, '@', 1)),
  NOW()
FROM auth.users
ON CONFLICT (id) DO UPDATE
SET
  display_name = EXCLUDED.display_name,
  updated_at = NOW();

-- Watering RPC: allows any authenticated user to water non-green plants.
CREATE OR REPLACE FUNCTION public.water_plant(p_plant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_plant RECORD;
  v_now TIMESTAMP WITH TIME ZONE := NOW();
  v_status TEXT;
  v_watering_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_plant
  FROM public.plants
  WHERE id = p_plant_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Plant not found';
  END IF;

  IF v_plant.next_watering_at IS NULL THEN
    v_status := 'red';
  ELSIF DATE(v_plant.next_watering_at) < DATE(v_now) THEN
    v_status := 'red';
  ELSIF DATE(v_plant.next_watering_at) = DATE(v_now) THEN
    v_status := 'yellow';
  ELSE
    v_status := 'green';
  END IF;

  IF v_status = 'green' THEN
    RAISE EXCEPTION 'This plant does not need watering yet';
  END IF;

  INSERT INTO public.waterings (plant_id, user_id, status, created_at)
  VALUES (p_plant_id, v_user_id, v_status, v_now)
  RETURNING id INTO v_watering_id;

  UPDATE public.plants
  SET
    last_watered_at = v_now,
    next_watering_at = v_now + (COALESCE(v_plant.watering_frequency, 1) || ' days')::INTERVAL
  WHERE id = p_plant_id;

  RETURN jsonb_build_object(
    'watering_id', v_watering_id,
    'plant_id', p_plant_id,
    'status', v_status,
    'watered_at', v_now
  );
END;
$$;

REVOKE ALL ON FUNCTION public.water_plant(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.water_plant(UUID) TO authenticated;
```

After running it, sign out and sign back in once so your profile row is synced.

### Step 5: Configure Environment Variables

1. In your project folder, create a file named `.env.local`
2. Add your Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```
   (Replace with your actual values from Step 1)

### Step 6: Install Dependencies

```bash
npm install
```

### Step 7: Start Development Server

```bash
npm run dev
```

The app will open at `http://localhost:5173`

## Login Credentials

- **Display Name:** `admin`
- **Password:** `admin1234`

## How to Use

### Creating Plants

1. Click "+ New Plant" button
2. Fill in plant details:
   - **Nickname:** Custom name for your plant
   - **Plant Type:** e.g., Monstera, Cactus
   - **Water Amount:** How much water in ml
   - **Frequency:** How often to water (in days)
   - **Sunlight:** Full sun, Partial shade, Low light, or Indirect light
   - **Location:** Where in the office
   - **Illustration:** Pick an image
3. Click "Create Plant"

### Watering Plants

1. On the dashboard, view all plants sorted by urgency
2. Plants show status with colored borders:
   - 🔴 Red = Overdue (past the next watering date)
   - 🟡 Yellow = Needs water today
   - 🟢 Green = Well-watered (coming soon)
3. Click "💧 Water" button on yellow or red plants
4. Green plants cannot be watered (button disabled)

### Leaderboard

- Click "🏆 Leaderboard" to see who has watered the most plants
- Only waterings of yellow/red plants count as points
- Green plant waterings are not recorded

## Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── Button.jsx
│   └── PlantCard.jsx
├── pages/               # Full page components
│   ├── Login.jsx
│   ├── Dashboard.jsx
│   ├── CreateEditPlant.jsx
│   └── Leaderboard.jsx
├── context/             # React context (auth state)
│   └── AuthContext.jsx
├── hooks/              # Custom React hooks
│   ├── useAuth.js
│   ├── usePlants.js
│   └── useWaterings.js
├── lib/                # Utilities
│   ├── supabase.js     # Supabase client
│   └── utils.js        # Helper functions
├── styles/             # CSS
│   └── global.css      # Global styles
├── App.jsx             # Main app
└── main.jsx            # Entry point
```

## Building for Production

```bash
npm run build
npm run preview
```

Output will be in the `dist/` folder.

## Troubleshooting

### "Cannot find module '@supabase/supabase-js'"
```bash
npm install
```

### Blank page or 404 errors
- Check that `.env.local` is set up correctly
- Verify Supabase URL and key are correct
- Make sure tables are created in Supabase

### "Auth error" when logging in
- Confirm the test user exists: admin@workshop.local
- Check that user_metadata has the display_name set
- Verify RLS policies are enabled

### Port 5173 already in use
```bash
npm run dev -- --port 3000
```

## Features Implemented

✅ Authentication (email + display name)  
✅ Plant CRUD (create, read, update, delete)  
✅ Watering system with status tracking  
✅ Automatic next watering calculation  
✅ Plant status indicators (red/yellow/green)  
✅ Leaderboard with scoring  
✅ Real-time data sync with Supabase  
✅ Mobile-responsive design  
✅ Activity history per plant  

## Next Steps

You can extend this app with:

- 🔔 Real-time notifications when someone waters a plant
- 📊 Statistics and charts
- 🌍 Plant care tips/guides
- 🖼️ Upload custom plant illustrations
- 💬 Comments/notes on plants
- 📱 Progressive Web App (PWA)
- 🌙 Dark mode

## Support

For issues or questions, refer to:
- Supabase docs: https://supabase.com/docs
- React docs: https://react.dev
- Vite docs: https://vitejs.dev
