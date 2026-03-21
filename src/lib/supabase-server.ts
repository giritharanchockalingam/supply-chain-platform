import { createClient } from '@supabase/supabase-js'

// Use placeholder URL during build when env vars are unavailable
// The client will fail at runtime if env vars are truly missing, but won't crash the build
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  db: { schema: 'supply_chain' }
})
