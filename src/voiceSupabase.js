import { createClient } from '@supabase/supabase-js';

// Existing Voice Flow Supabase project. The publishable key is public by design.
// Cloudflare Vite variables can override these defaults.
const url = import.meta.env.VITE_SUPABASE_URL || 'https://brxkommyabngrqhwsmfk.supabase.co';
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_OQz6_5DszKI9ZTdZBHT_Fw_UmDGeuML';
export const voiceSupabase = createClient(url,key,{
  auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true},
});
