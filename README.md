# 🌱 Office Plant Care App

A Tamagotchi-style web app for taking care of office plants. Multiple people share responsibility for watering plants in an office. The app tracks each plant's watering schedule, shows which plants need attention, and gamifies the experience with a leaderboard and real-time notifications.

## Tech Stack

- **Frontend:** React 18 + Vite
- **Backend:** Supabase (PostgreSQL database, authentication, real-time subscriptions)
- **Styling:** CSS Modules
- **Routing:** React Router v6

## Features

✅ Email/password authentication with display names  
✅ Plant management (create, edit, delete)  
✅ Visual status indicators (green/yellow/red borders)  
✅ Watering action with automatic scheduling  
✅ Activity feed per plant  
✅ Leaderboard system (scoring based on waterings)  
✅ Real-time notifications  
✅ Mobile-responsive design  

## Setup Instructions

### 1. Prerequisites

- Node.js 16+ and npm/yarn installed
- A Supabase project (free tier available at https://supabase.com)

### 2. Clone & Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

#### Create Tables

Run the following SQL in your Supabase SQL editor:

```sql
-- Create plants table
CREATE TABLE plants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  plant_type TEXT NOT NULL,
  water_amount_ml INTEGER NOT NULL,
  watering_frequency INTEGER NOT NULL,
  sunlight_needs TEXT,
  location TEXT NOT NULL,
  illustration TEXT,
  last_watered_at TIMESTAMP WITH TIME ZONE,
  next_watering_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create waterings table
CREATE TABLE waterings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('red', 'yellow', 'green')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX plants_owner_id ON plants(owner_id);
CREATE INDEX plants_next_watering_at ON plants(next_watering_at);
CREATE INDEX waterings_plant_id ON waterings(plant_id);
CREATE INDEX waterings_user_id ON waterings(user_id);
```

#### Set Up Row-Level Security (RLS)

Enable RLS on both tables:

```sql
-- Enable RLS
ALTER TABLE plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE waterings ENABLE ROW LEVEL SECURITY;

-- Plants Policies
CREATE POLICY "Users can view all plants"
  ON plants FOR SELECT
  USING (true);

CREATE POLICY "Users can create plants"
  ON plants FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Only owners can update their plants"
  ON plants FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Only owners can delete their plants"
  ON plants FOR DELETE
  USING (auth.uid() = owner_id);

-- Waterings Policies
CREATE POLICY "Users can view all waterings"
  ON waterings FOR SELECT
  USING (true);

CREATE POLICY "Users can record waterings"
  ON waterings FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

#### Create Dummy Account

In the Supabase dashboard:

1. Go to Authentication → Users
2. Click "Create new user"
3. Email: `admin@workshop.local`
4. Password: `admin1234`
5. Save the user
6. Edit the user and set `user_metadata`:
   ```json
   {
     "display_name": "admin"
   }
   ```

### 4. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Get these from Supabase:
- Go to Settings → API
- Copy the Project URL and Anon Key

### 5. Run Development Server

```bash
npm run dev
```

The app will open at `http://localhost:5173`

### 6. Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Button.jsx
│   ├── PlantCard.jsx
│   └── *.module.css
├── pages/              # Page components
│   ├── Login.jsx
│   ├── Dashboard.jsx
│   ├── CreateEditPlant.jsx
│   └── Leaderboard.jsx
├── context/            # React context providers
│   └── AuthContext.jsx
├── hooks/              # Custom React hooks
│   ├── useAuth.js
│   ├── usePlants.js
│   └── useWaterings.js
├── lib/                # Utilities and config
│   ├── supabase.js
│   └── utils.js
├── styles/             # Global styles
│   └── global.css
├── App.jsx             # Main app component
└── main.jsx            # Entry point
```

## Authentication Flow

1. User enters display name and password on login screen
2. App converts display name to lowercase and appends `@workshop.local`
3. Example: "Maria" → `maria@workshop.local`
4. Backend validates against Supabase auth
5. On success, user is redirected to dashboard

## Plant Status

- 🟢 **Green:** Plant doesn't need watering (next watering date is in the future)
- 🟡 **Yellow:** Plant needs watering today
- 🔴 **Red:** Plant is overdue for watering

## Watering System

When a user waters a plant:
1. Plant status (red/yellow) is recorded in waterings table
2. Plant's `last_watered_at` is set to current time
3. Plant's `next_watering_at` is calculated as now + watering frequency
4. Green plants cannot be watered (button disabled)

## Leaderboard

Users are ranked by number of waterings. Each watering of a red or yellow plant = 1 point.

## API Reference

### useAuth Hook

```javascript
const { user, loading, login, logout } = useAuth()
```

### usePlants Hook

```javascript
const {
  plants,
  loading,
  error,
  fetchPlants,
  createPlant,
  updatePlant,
  deletePlant
} = usePlants()
```

### useWaterings Hook

```javascript
const {
  waterings,
  loading,
  error,
  waterPlant,
  fetchWaterings
} = useWaterings(plantId)
```

## Contributing

Feel free to submit issues or pull requests.

## License

MIT
