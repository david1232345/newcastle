import { createBrowserClient } from "@supabase/ssr";
import { assertPublicSupabaseEnv } from "./env.js";

let browserClient;

export function createClient() {
  if (browserClient) {
    return browserClient;
  }

  const { url, key } = assertPublicSupabaseEnv();
  browserClient = createBrowserClient(url, key);
  return browserClient;
}
