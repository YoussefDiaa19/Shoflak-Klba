import { supabase } from './supabase';

async function run() {
  const { data, error } = await supabase.from('chats').select('id').limit(1);
  console.log("chats:", data);
  const { data: mData, error: mErr } = await supabase.from('messages').select('chat_id').limit(1);
  console.log("messages:", mData);
}
run();
