-- Fix the handle_new_user trigger in Supabase
-- Run this in the Supabase SQL Editor. 
-- It gracefully handles missing fields and inserts a new profile correctly.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Guest User'), 
    COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', '')
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Log the error instead of failing the user sign-up
  RAISE LOG 'Error in handle_new_user trigger: %', SQLERRM;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Make sure the trigger is actually bound to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure profiles table has a language column with a default value
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS language text DEFAULT 'en';

-- Ensure city and area allow nulls during initial sign up
ALTER TABLE public.profiles ALTER COLUMN city DROP NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN area DROP NOT NULL;
