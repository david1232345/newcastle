import { createServerClient } from "@supabase/ssr";
import { assertPublicSupabaseEnv } from "./env.js";

export function createMiddlewareClient({ getAll, setAll }) {
  const { url, key } = assertPublicSupabaseEnv();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return getAll?.() || [];
      },
      setAll(cookiesToSet) {
        setAll?.(cookiesToSet);
      }
    }
  });
}
