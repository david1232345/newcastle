import { createClient } from "@supabase/supabase-js";
import {
  assertServerSupabaseEnv,
  isSupabaseServerConfigured
} from "./env.js";

let adminClient;

export function createAdminClient() {
  if (adminClient) {
    return adminClient;
  }

  const { url, key } = assertServerSupabaseEnv();

  adminClient = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false
    },
    global: {
      headers: {
        "X-Client-Info": "newcastle-team-bot-ia"
      }
    }
  });

  return adminClient;
}

export { isSupabaseServerConfigured };
