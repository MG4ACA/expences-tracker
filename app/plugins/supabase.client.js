// plugins/supabase.client.js
// Supabase client initialization for the expense tracker app

import { createClient } from '@supabase/supabase-js';

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();

  const supabaseUrl = config.public.supabaseUrl || import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = config.public.supabaseKey || import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase URL and key must be set in .env.local');
    throw new Error('Supabase configuration missing');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  return {
    provide: {
      supabase,
    },
  };
});
