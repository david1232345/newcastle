import { createAdminClient, isSupabaseServerConfigured } from "../utils/supabase/admin.js";

if (!isSupabaseServerConfigured()) {
  console.error(
    "Faltan SUPABASE_URL y SUPABASE_SECRET_KEY o SUPABASE_SERVICE_ROLE_KEY."
  );
  process.exit(1);
}

const supabase = createAdminClient();
const { count, error } = await supabase
  .from("players")
  .select("id", { count: "exact", head: true });

if (error) {
  console.error("No se pudo conectar con Supabase:", error.message);
  process.exit(1);
}

console.log(`Supabase conectado correctamente. Jugadores registrados: ${count || 0}`);
