import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  (import.meta as any).env?.VITE_SUPABASE_URL || 'https://iycnohkobazaduldxiqc.supabase.co';
const supabaseKey =
  (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY ||
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5Y25vaGtvYmF6YWR1bGR4aXFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2NzUxMzIsImV4cCI6MjEwNjI1MTEzMn0.HhZzx9yzQGvk0LqDU5ZVk3qKKMyFMWlI3tLDsCqsPKw';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
