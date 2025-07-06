// components/AuthProvider.tsx
'use client';

import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { createClient } from '@/lib/supabase/client';
import { ReactNode } from 'react';

export default function AuthProvider({ children }: { children: ReactNode }) {
  const supabaseClient = createClient();

  return (
    <SessionContextProvider supabaseClient={supabaseClient}>
      {children}
    </SessionContextProvider>
  );
}