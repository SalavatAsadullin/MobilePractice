import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://sfwwkdrhmxpnsnmgcrje.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_VDhsYT0b1jbALOnHDDhVGA_ZDsQIgHZ';

const ExpoSecureStoreAdapter = {
  getItem:    (key) => AsyncStorage.getItem(key),
  setItem:    (key, value) => AsyncStorage.setItem(key, value),
  removeItem: (key) => AsyncStorage.removeItem(key),
};
 
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});