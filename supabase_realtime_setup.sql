-- 1. Enable Realtime for all relevant tables
-- This ensures Supabase broadcasts changes for these tables
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

-- Add all tables to the publication
-- We use a loop to handle tables that might already be added
DO $$
DECLARE
    t text;
    tables_to_add text[] := ARRAY['messages', 'chats', 'pets', 'profiles', 'support_inquiries', 'pet_reports', 'message_reports'];
BEGIN
    FOREACH t IN ARRAY tables_to_add LOOP
        BEGIN
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', t);
        EXCEPTION
            WHEN duplicate_object THEN
                NULL; -- Table already in publication
            WHEN undefined_table THEN
                NULL; -- Table doesn't exist yet
        END;
    END LOOP;
END $$;

-- 2. Set replica identity to FULL for better update/delete tracking
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.chats REPLICA IDENTITY FULL;

-- 3. Ensure RLS is enabled and policies allow users to see their data
-- If RLS is ON, users MUST have SELECT permission to receive Realtime events
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- === PROFILES ===
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- === PETS ===
CREATE POLICY "Approved pets are viewable by everyone" ON public.pets FOR SELECT USING (status = 'approved' OR (auth.uid())::text = owner_id);
CREATE POLICY "Users can insert their own pets" ON public.pets FOR INSERT WITH CHECK ((auth.uid())::text = owner_id);
CREATE POLICY "Users can update their own pets" ON public.pets FOR UPDATE USING ((auth.uid())::text = owner_id);
CREATE POLICY "Users can delete their own pets" ON public.pets FOR DELETE USING ((auth.uid())::text = owner_id);

-- === CHATS ===
-- Using JSONB containment operator @> to check if user is in participants
CREATE POLICY "Users can view their own chats" ON public.chats FOR SELECT USING (participants @> jsonb_build_array((auth.uid())::text));
CREATE POLICY "Users can insert chats" ON public.chats FOR INSERT WITH CHECK (participants @> jsonb_build_array((auth.uid())::text));
CREATE POLICY "Users can update their own chats" ON public.chats FOR UPDATE USING (participants @> jsonb_build_array((auth.uid())::text));

-- === MESSAGES ===
CREATE POLICY "Users can view messages in their chats" ON public.messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.chats WHERE chats.id = messages.chat_id AND chats.participants @> jsonb_build_array((auth.uid())::text))
);
CREATE POLICY "Users can insert messages in their chats" ON public.messages FOR INSERT WITH CHECK (
    (auth.uid())::text = sender_id AND
    EXISTS (SELECT 1 FROM public.chats WHERE chats.id = messages.chat_id AND chats.participants @> jsonb_build_array((auth.uid())::text))
);
CREATE POLICY "Users can update messages in their chats" ON public.messages FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.chats WHERE chats.id = messages.chat_id AND chats.participants @> jsonb_build_array((auth.uid())::text))
);

-- === FAVORITES ===
CREATE POLICY "Users can view their own favorites" ON public.favorites FOR SELECT USING ((auth.uid())::text = user_id);
CREATE POLICY "Users can insert their own favorites" ON public.favorites FOR INSERT WITH CHECK ((auth.uid())::text = user_id);
CREATE POLICY "Users can delete their own favorites" ON public.favorites FOR DELETE USING ((auth.uid())::text = user_id);

-- === SUPPORT INQUIRIES ===
CREATE POLICY "Users can view their own inquiries" ON public.support_inquiries FOR SELECT USING ((auth.uid())::text = owner_id);
CREATE POLICY "Users can insert their own inquiries" ON public.support_inquiries FOR INSERT WITH CHECK ((auth.uid())::text = owner_id);

-- === REPORTS ===
CREATE POLICY "Users can insert pet reports" ON public.pet_reports FOR INSERT WITH CHECK ((auth.uid())::text = reporter_id);
CREATE POLICY "Users can insert message reports" ON public.message_reports FOR INSERT WITH CHECK ((auth.uid())::text = reporter_id);

-- === STORAGE POLICIES (for chat-media bucket) ===
-- Note: These must be run in the SQL Editor. 
-- They allow authenticated users to upload their own chat media and anyone (public) to view them.

-- 1. Allow public read access to chat media (if the bucket is public)
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'chat-media');

-- 2. Allow authenticated users to upload files to the chat-media bucket
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'chat-media');

-- 3. (Optional) Allow users to delete their own uploads
CREATE POLICY "Users can delete their own media" ON storage.objects FOR DELETE TO authenticated 
USING (bucket_id = 'chat-media' AND (auth.uid())::text = (storage.foldername(name))[2]);

-- === ADMIN POLICIES ===
-- We use the user's email from the JWT to identify the admin and avoid infinite recursion
-- The email 'youssefdiaa19@gmail.com' is treated as the super admin
CREATE POLICY "Admins can do everything on profiles" ON public.profiles FOR ALL USING (auth.jwt() ->> 'email' = 'youssefdiaa19@gmail.com');
CREATE POLICY "Admins can do everything on pets" ON public.pets FOR ALL USING (auth.jwt() ->> 'email' = 'youssefdiaa19@gmail.com');
CREATE POLICY "Admins can do everything on chats" ON public.chats FOR ALL USING (auth.jwt() ->> 'email' = 'youssefdiaa19@gmail.com');
CREATE POLICY "Admins can do everything on messages" ON public.messages FOR ALL USING (auth.jwt() ->> 'email' = 'youssefdiaa19@gmail.com');
CREATE POLICY "Admins can do everything on support_inquiries" ON public.support_inquiries FOR ALL USING (auth.jwt() ->> 'email' = 'youssefdiaa19@gmail.com');
CREATE POLICY "Admins can do everything on pet_reports" ON public.pet_reports FOR ALL USING (auth.jwt() ->> 'email' = 'youssefdiaa19@gmail.com');
CREATE POLICY "Admins can do everything on message_reports" ON public.message_reports FOR ALL USING (auth.jwt() ->> 'email' = 'youssefdiaa19@gmail.com');

-- 4. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;
