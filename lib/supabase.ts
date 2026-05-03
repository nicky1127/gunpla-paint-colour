import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace these with your Supabase project URL and anon key
// Found at: https://supabase.com/dashboard → your project → Settings → API
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'YOUR_ANON_KEY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database types
export type Project = {
  id: string;
  name: string;
  kit_name: string | null;
  kit_code: string | null;
  created_at: string;
};

export type ProjectColour = {
  id: string;
  project_id: string;
  colour_name: string;
  hex: string | null;
  source: 'ai' | 'manual' | 'image';
  notes: string | null;
  created_at: string;
};

export type PaintInventory = {
  id: string;
  brand: string;
  code: string | null;
  name: string;
  hex: string | null;
  created_at: string;
};

export type MixSuggestion = {
  id: string;
  project_colour_id: string;
  suggestion_json: MixSuggestionData;
  created_at: string;
};

export type MixSuggestionData = {
  using_owned: MixStep[] | null;
  buy_suggestion: BuySuggestion[] | null;
  notes: string;
};

export type MixStep = {
  paint_id: string;
  brand: string;
  code: string | null;
  name: string;
  hex: string | null;
  ratio_percent: number;
};

export type BuySuggestion = {
  brand: string;
  code: string;
  name: string;
  hex: string | null;
  ratio_percent: number;
};
