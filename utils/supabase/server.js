import { createServerClient } from "@supabase/ssr";
import { assertPublicSupabaseEnv } from "./env.js";

export function createClient(cookieStore) {
  const { url, key } = assertPublicSupabaseEnv();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore?.getAll?.() || [];
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore?.set?.(name, value, options);
          });
        } catch {
          // En un componente de servidor de solo lectura no siempre se pueden escribir cookies.
        }
      }
    }
  });
}
