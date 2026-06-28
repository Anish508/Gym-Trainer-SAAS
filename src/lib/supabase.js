import { createClient } from '@supabase/supabase-js';

let supabaseClient = null;
let isSupabaseActive = false;

// Check if configurations are complete and not placeholders
const isValidConfig = (url, key) => {
  return url && 
         url.trim() !== '' && 
         url.indexOf('YOUR_') === -1 && 
         key && 
         key.trim() !== '' && 
         key.indexOf('YOUR_') === -1;
};

const cleanUrl = (url) => {
  if (!url) return '';
  return url.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
};

export function initSupabase() {
  // 1. Try Loading from Next.js Environment variables first
  let supabaseUrl = cleanUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  let supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (isValidConfig(supabaseUrl, supabaseAnonKey)) {
    try {
      supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
      isSupabaseActive = true;
      console.log("Keerthan MindFit: Supabase initialized from Environment Variables. Cloud DB Mode.");
      return { supabase: supabaseClient, active: true };
    } catch (error) {
      console.error("Failed to initialize Supabase from env variables:", error);
    }
  }

  // 2. Fallback to LocalStorage Settings configuration
  if (typeof window !== 'undefined') {
    const localSettings = localStorage.getItem('kmf_gym_settings');
    if (localSettings) {
      try {
        const parsed = JSON.parse(localSettings);
        if (parsed.supabaseConfig && isValidConfig(parsed.supabaseConfig.supabaseUrl, parsed.supabaseConfig.supabaseAnonKey)) {
          const storedUrl = cleanUrl(parsed.supabaseConfig.supabaseUrl);
          supabaseClient = createClient(storedUrl, parsed.supabaseConfig.supabaseAnonKey);
          isSupabaseActive = true;
          console.log("Keerthan MindFit: Supabase initialized from Gym Settings. Cloud DB Mode.");
          return { supabase: supabaseClient, active: true };
        }
      } catch (e) {
        console.error("Failed to parse local gym settings for Supabase Config:", e);
      }
    }
  }

  console.warn("Keerthan MindFit: Supabase configurations are incomplete or missing. Operating in Demo Mode (Local Storage).");
  isSupabaseActive = false;
  supabaseClient = null;
  return { supabase: null, active: false };
}

// Get the references
export function getSupabaseRef() {
  if (!supabaseClient && typeof window !== 'undefined') {
    // If not initialized yet, initialize now
    return initSupabase();
  }
  return { supabase: supabaseClient, active: isSupabaseActive };
}
