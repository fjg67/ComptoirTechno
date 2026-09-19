import { createClient } from '@supabase/supabase-js';

// Configuration de Supabase
// Idéalement, ces clés devraient être dans un fichier .env (VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY)
// Pour l'exemple, nous lisons les variables d'environnement Vite.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://votre-projet.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'votre-cle-anon';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
