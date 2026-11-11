import { createClient } from "@supabase/supabase-js";

// ดึง URL และ Publishable Key จากไฟล์ .env.local
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// สร้างตัวเชื่อมต่อกับ Supabase
export const supabase = createClient(supabaseUrl, supabaseKey);
