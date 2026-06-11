const SUPABASE_URL = 'https://udoohspcusdgmdqwppjh.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkb29oc3BjdXNkZ21kcXdwcGpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMzAyNTAsImV4cCI6MjA5NjYwNjI1MH0.RNJQm8v-xHp4sF1VCrkBgXeer7Z32MaXA9ZyWVPFVuQ';

const _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { 
    detectSessionInUrl: true, 
    persistSession: true, 
    autoRefreshToken: true,
    storageKey: 'sb-kekeprice-auth'
  }
});