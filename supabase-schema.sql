-- =========================================================================
-- KEERTHAN MINDFIT - COMPLETE DATABASE SCHEMA FOR SUPABASE
-- Run these commands in your Supabase SQL Editor (https://supabase.com)
-- =========================================================================

-- 1. GYM MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.members (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    gender TEXT DEFAULT 'Male',
    age INTEGER,
    height NUMERIC(5,2),
    weight NUMERIC(5,2),
    bmi TEXT,
    mobile_number TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    address TEXT,
    emergency_contact TEXT NOT NULL,
    blood_group TEXT,
    fitness_goal TEXT DEFAULT 'General Fitness',
    join_date DATE NOT NULL,
    membership_plan TEXT DEFAULT 'Monthly',
    status TEXT DEFAULT 'active',
    trainer_notes TEXT,
    medical_conditions TEXT,
    profile_photo TEXT,
    is_p_t BOOLEAN DEFAULT FALSE,
    pt_fees NUMERIC(10,2) DEFAULT 0.00,
    pt_schedule TEXT,
    pt_sessions_completed INTEGER DEFAULT 0,
    pt_sessions_total INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. DAILY ATTENDANCE TABLE
CREATE TABLE IF NOT EXISTS public.attendance (
    id TEXT PRIMARY KEY,
    member_id TEXT REFERENCES public.members(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT DEFAULT 'present',
    check_in_time TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. MEMBERSHIP PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS public.payments (
    id TEXT PRIMARY KEY,
    member_id TEXT REFERENCES public.members(id) ON DELETE CASCADE,
    plan_type TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status TEXT DEFAULT 'paid',
    transaction_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. MEMBER WORKOUT ROUTINES TABLE
CREATE TABLE IF NOT EXISTS public.workouts (
    id TEXT PRIMARY KEY,
    member_id TEXT REFERENCES public.members(id) ON DELETE CASCADE,
    plan_name TEXT NOT NULL,
    difficulty TEXT DEFAULT 'Intermediate',
    fitness_goal TEXT,
    schedule JSONB NOT NULL, -- Format: {"Monday": "Chest", "Tuesday": "Back", ...}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. MEMBER DIET PLANS TABLE
CREATE TABLE IF NOT EXISTS public.diet_plans (
    id TEXT PRIMARY KEY,
    member_id TEXT REFERENCES public.members(id) ON DELETE CASCADE,
    plan_name TEXT NOT NULL,
    target_calories INTEGER DEFAULT 2000,
    target_protein NUMERIC(5,1) DEFAULT 100,
    target_carbs NUMERIC(5,1) DEFAULT 200,
    target_fats NUMERIC(5,1) DEFAULT 60,
    water_intake NUMERIC(5,1) DEFAULT 2500,
    meals JSONB NOT NULL, -- Format: {"Breakfast": "Oats", "Lunch": "Rice + Chicken", ...}
    supplements TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. BODY PROGRESS TRACKER TABLE
CREATE TABLE IF NOT EXISTS public.progress (
    id TEXT PRIMARY KEY,
    member_id TEXT REFERENCES public.members(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    weight NUMERIC(5,2),
    chest NUMERIC(5,2),
    waist NUMERIC(5,2),
    hips NUMERIC(5,2),
    biceps NUMERIC(5,2),
    thighs NUMERIC(5,2),
    body_fat NUMERIC(4,1),
    before_photo TEXT,
    after_photo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 7. NOTIFICATIONS BROADCAST TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY,
    member_id TEXT NOT NULL DEFAULT 'All', -- Can reference member ID or 'All'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'system', -- 'system', 'workout', 'diet', 'fee'
    date DATE NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 8. RESCHEDULED WORKOUTS TABLE
CREATE TABLE IF NOT EXISTS public.rescheduled_workouts (
    id TEXT PRIMARY KEY,
    member_id TEXT REFERENCES public.members(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    workout_name TEXT NOT NULL,
    status TEXT DEFAULT 'missed',
    rescheduled_to DATE NOT NULL,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 9. GLOBAL SYSTEM SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.settings (
    id TEXT PRIMARY KEY DEFAULT 'settings',
    gym_name TEXT DEFAULT 'Keerthan MindFit',
    logo TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    social_links JSONB DEFAULT '{"instagram": "", "youtube": "", "facebook": ""}'::jsonb,
    supabase_url TEXT,
    supabase_anon_key TEXT,
    gemini_api_key TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Seed Initial System Settings
INSERT INTO public.settings (id, gym_name, address, phone, email)
VALUES ('settings', 'Keerthan MindFit', 'Keerthan MindFit Center, Bengaluru, IN', '+91 99887 76655', 'info@keerthanmindfit.com')
ON CONFLICT (id) DO NOTHING;

-- 10. WORKOUT TEMPLATES LIBRARY TABLE
CREATE TABLE IF NOT EXISTS public.workout_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    goal TEXT,
    difficulty TEXT DEFAULT 'Intermediate',
    description TEXT,
    split_type TEXT,
    duration TEXT,
    days_count INTEGER,
    muscles TEXT,
    is_favorite BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    schedule JSONB NOT NULL
);

-- Disable Row Level Security (RLS) to allow direct CRUD operations without policies
ALTER TABLE public.members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.diet_plans DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.rescheduled_workouts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_templates DISABLE ROW LEVEL SECURITY;

-- Migration/Updates for existing database installations
ALTER TABLE public.workout_templates ADD COLUMN IF NOT EXISTS split_type TEXT;
ALTER TABLE public.workout_templates ADD COLUMN IF NOT EXISTS duration TEXT;
ALTER TABLE public.workout_templates ADD COLUMN IF NOT EXISTS days_count INTEGER;
ALTER TABLE public.workout_templates ADD COLUMN IF NOT EXISTS muscles TEXT;
ALTER TABLE public.workout_templates ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;
ALTER TABLE public.workout_templates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW());

ALTER TABLE public.workouts ADD COLUMN IF NOT EXISTS template_id TEXT;


