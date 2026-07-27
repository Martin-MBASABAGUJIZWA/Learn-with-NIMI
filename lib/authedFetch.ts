// Drop-in replacement for fetch() that injects the Supabase access token
// as "Authorization: Bearer <token>".  Route handlers that use getAuthUser()
// also accept cookie-based sessions, but this explicit header works in both
// cookie and non-cookie environments.

import supabase from "@/lib/supabaseClient";

export async function authedFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  return fetch(url, {
    ...init,
    headers: {
      ...(init.headers as Record<string, string> | undefined),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}
