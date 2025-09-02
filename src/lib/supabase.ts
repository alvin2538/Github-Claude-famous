import { createClient } from '@supabase/supabase-js';


// Initialize Supabase client
// Using direct values from project configuration
const supabaseUrl = 'https://dsbdxzqpjurhpewtfhfn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzYmR4enFwanVyaHBld3RmaGZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyODgzNzIsImV4cCI6MjA2Mzg2NDM3Mn0.D_4B-Ok7S4WACtGINWZhD_cIl1_WAPWQr10MeQbAO4w';
const supabase = createClient(supabaseUrl, supabaseKey);


export { supabase };