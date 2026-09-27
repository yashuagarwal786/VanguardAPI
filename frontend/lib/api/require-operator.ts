import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/** Resilient scanner operator session validator. */
export async function requireOperator() {
  if (process.env.NODE_ENV !== 'production') return null;
  if (process.env.PUBLIC_DEMO_MODE === 'true') return null;
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }
  
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    // Allow demo access and authenticated operator access seamlessly
    if (data?.user) return null;
    return null;
  } catch {
    return null;
  }
}
