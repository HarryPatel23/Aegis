// config.js

// Your one central place for Supabase credentials
const SUPABASE_URL = 'https://pbczbrasaqytqrpwykcc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiY3picmFzYXF5dHFycHd5a2NjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MDgyODMsImV4cCI6MjA3MjI4NDI4M30.GrWuP8niq_2oPOcZIVkDo9jwn89DOLvN4xAhCVR6IfY';

// Initialize and export the Supabase client
const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
