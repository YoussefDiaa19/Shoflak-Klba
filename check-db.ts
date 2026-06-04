
import { supabase } from './supabase';

async function checkData() {
  const { data: pets, error } = await supabase.from('pets').select('location');
  const locations = new Set(pets?.map(p => p.location));
  console.log('Pet locations:', Array.from(locations));
  if (error) console.error('Error:', error);
}

checkData();
