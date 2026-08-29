import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://plvrapxybdnwmquossb.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsdnJhcHh5YmhkbndtcXVvc3NiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5MDAxNTIsImV4cCI6MjEwMzQ3NjE1Mn0.5zziRxyOMI_-eipi4-LXP2oROM0u7X_sD86NhuFoyz4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});