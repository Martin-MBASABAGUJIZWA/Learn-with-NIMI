"use client";

import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { useState, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export default function SupabaseProviderWrapper({ children }: Props) {
    const [supabase] = useState(() => createPagesBrowserClient());
    return <SessionContextProvider supabaseClient={supabase}>{children}</SessionContextProvider>;
}
