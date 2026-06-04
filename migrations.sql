
-- Run this in your Supabase SQL Editor to ensure the profiles table has all required columns.

-- 1. Add missing columns to the profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS blocked_user_ids jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reported_pet_ids jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS fcm_token text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS language text DEFAULT 'en';

-- 2. Add missing columns to the pets table if any
ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone;
ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';

-- 3. Update RLS policies to be more permissive for pet management
DROP POLICY IF EXISTS "Approved pets are viewable by everyone" ON public.pets;
CREATE POLICY "Approved pets are viewable by everyone" ON public.pets FOR SELECT USING (status = 'approved' OR (auth.uid())::text = owner_id);

DROP POLICY IF EXISTS "Users can insert their own pets" ON public.pets;
CREATE POLICY "Users can insert their own pets" ON public.pets FOR INSERT WITH CHECK ((auth.uid())::text = owner_id);

DROP POLICY IF EXISTS "Users can update their own pets" ON public.pets;
CREATE POLICY "Users can update their own pets" ON public.pets FOR UPDATE USING ((auth.uid())::text = owner_id);

DROP POLICY IF EXISTS "Users can delete their own pets" ON public.pets;
CREATE POLICY "Users can delete their own pets" ON public.pets FOR DELETE USING ((auth.uid())::text = owner_id);

-- 4. Ensure city and area allow nulls in profiles
ALTER TABLE public.profiles ALTER COLUMN city DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN area DROP NOT NULL;
