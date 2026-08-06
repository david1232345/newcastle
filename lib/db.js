import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  createAdminClient,
  isSupabaseServerConfigured
} from "../utils/supabase/admin.js";

const localFile = path.join(process.cwd(), "data", "local-store.json");

function supabaseConfigured() {
  return isSupabaseServerConfigured();
}

function throwSupabaseError(error, action) {
  const message = error?.message || "Error desconocido";
  const wrapped = new Error(`Supabase no pudo ${action}: ${message}`);
  wrapped.statusCode = Number(error?.status) || 500;
  wrapped.cause = error;
  throw wrapped;
}

function emptyStore() {
  return { players: [], officials: [], officialPlayers: [], replayReports: [] };
}

async function readLocalStore() {
  try {
    const raw = await fs.readFile(localFile, "utf8");
    return { ...emptyStore(), ...JSON.parse(raw) };
  } catch {
    const store = emptyStore();
    await fs.mkdir(path.dirname(localFile), { recursive: true });
    await fs.writeFile(localFile, JSON.stringify(store, null, 2));
    return store;
  }
}

async function writeLocalStore(store) {
  if (process.env.VERCEL) {
    const error = new Error("Configura Supabase para guardar datos persistentes en Vercel.");
    error.statusCode = 503;
    throw error;
  }
  await fs.mkdir(path.dirname(localFile), { recursive: true });
  await fs.writeFile(localFile, JSON.stringify(store, null, 2));
}

export async function listPlayers() {
  if (supabaseConfigured()) {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .order("nickname", { ascending: true });
    if (error) throwSupabaseError(error, "listar jugadores");
    return data || [];
  }
  const store = await readLocalStore();
  return store.players.sort((a, b) => a.nickname.localeCompare(b.nickname, "es"));
}

export async function getPlayerByDiscordId(discordUserId) {
  if (supabaseConfigured()) {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .eq("discord_user_id", String(discordUserId))
      .maybeSingle();
    if (error) throwSupabaseError(error, "buscar al jugador de Discord");
    return data || null;
  }
  const store = await readLocalStore();
  return store.players.find((player) => player.discord_user_id === discordUserId) || null;
}

export async function upsertPlayer({ nickname, discordUserId, dmOptIn = true }) {
  const payload = {
    nickname: String(nickname).trim(),
    discord_user_id: String(discordUserId).trim(),
    dm_opt_in: Boolean(dmOptIn),
    active: true,
    updated_at: new Date().toISOString()
  };

  if (supabaseConfigured()) {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("players")
      .upsert(payload, { onConflict: "discord_user_id" })
      .select("*")
      .single();
    if (error) throwSupabaseError(error, "guardar al jugador");
    return data;
  }

  const store = await readLocalStore();
  const existing = store.players.find((player) => player.discord_user_id === payload.discord_user_id);
  if (existing) {
    Object.assign(existing, payload);
    await writeLocalStore(store);
    return existing;
  }
  const player = { id: randomUUID(), created_at: new Date().toISOString(), ...payload };
  store.players.push(player);
  await writeLocalStore(store);
  return player;
}

export async function setDmOptIn(discordUserId, dmOptIn) {
  const player = await getPlayerByDiscordId(discordUserId);
  if (!player) {
    return null;
  }

  if (supabaseConfigured()) {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("players")
      .update({
        dm_opt_in: Boolean(dmOptIn),
        updated_at: new Date().toISOString()
      })
      .eq("id", player.id)
      .select("*")
      .single();
    if (error) throwSupabaseError(error, "actualizar los avisos del jugador");
    return data;
  }

  const store = await readLocalStore();
  const row = store.players.find((item) => item.id === player.id);
  row.dm_opt_in = Boolean(dmOptIn);
  row.updated_at = new Date().toISOString();
  await writeLocalStore(store);
  return row;
}

export async function createOfficial({ opponent, competition, startsAt, checkOpensAt, notes, playerIds, createdBy }) {
  const official = {
    id: randomUUID(),
    opponent: String(opponent).trim(),
    competition: String(competition || "Liga").trim(),
    starts_at: new Date(startsAt).toISOString(),
    check_opens_at: checkOpensAt
      ? new Date(checkOpensAt).toISOString()
      : new Date(new Date(startsAt).getTime() - 30 * 60 * 1000).toISOString(),
    notes: String(notes || "").trim(),
    status: "scheduled",
    created_by: createdBy || "web",
    reminder_24h_sent: false,
    reminder_1h_sent: false,
    check_open_sent: false,
    created_at: new Date().toISOString()
  };

  if (supabaseConfigured()) {
    const supabase = createAdminClient();
    const { id: ignoredId, ...databaseOfficial } = official;
    const { data: saved, error } = await supabase
      .from("officials")
      .insert(databaseOfficial)
      .select("*")
      .single();
    if (error) throwSupabaseError(error, "crear el partido oficial");

    if (playerIds?.length) {
      const invitations = playerIds.map((playerId) => ({
        official_id: saved.id,
        player_id: playerId,
        check_status: "pending"
      }));
      const { error: invitationError } = await supabase
        .from("official_players")
        .insert(invitations);
      if (invitationError) {
        await supabase.from("officials").delete().eq("id", saved.id);
        throwSupabaseError(invitationError, "guardar los convocados");
      }
    }

    return await getOfficial(saved.id);
  }

  const store = await readLocalStore();
  store.officials.push(official);
  for (const playerId of playerIds || []) {
    store.officialPlayers.push({
      id: randomUUID(), official_id: official.id, player_id: playerId,
      check_status: "pending", checked_at: null, created_at: new Date().toISOString()
    });
  }
  await writeLocalStore(store);
  return await getOfficial(official.id);
}

export async function getOfficial(id) {
  if (supabaseConfigured()) {
    const supabase = createAdminClient();
    const { data: official, error } = await supabase
      .from("officials")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throwSupabaseError(error, "buscar el partido oficial");
    if (!official) return null;

    const { data: invitations, error: invitationError } = await supabase
      .from("official_players")
      .select("*, players(*)")
      .eq("official_id", id)
      .order("created_at", { ascending: true });
    if (invitationError) throwSupabaseError(invitationError, "listar los convocados");

    return {
      ...official,
      invitations: (invitations || []).map((item) => ({
        ...item,
        player: item.players || null
      }))
    };
  }

  const store = await readLocalStore();
  const official = store.officials.find((item) => item.id === id);
  if (!official) return null;
  const invitations = store.officialPlayers
    .filter((item) => item.official_id === id)
    .map((item) => ({
      ...item,
      player: store.players.find((player) => player.id === item.player_id) || null
    }));
  return { ...official, invitations };
}

export async function listOfficials({ upcomingOnly = false } = {}) {
  if (supabaseConfigured()) {
    const supabase = createAdminClient();
    let query = supabase
      .from("officials")
      .select("*")
      .order("starts_at", { ascending: true });

    if (upcomingOnly) {
      query = query.gte("starts_at", new Date().toISOString());
    }

    const { data: officials, error } = await query;
    if (error) throwSupabaseError(error, "listar los partidos oficiales");

    const output = [];
    for (const official of officials || []) {
      output.push(await getOfficial(official.id));
    }
    return output;
  }

  const store = await readLocalStore();
  let rows = [...store.officials];
  if (upcomingOnly) {
    const now = Date.now();
    rows = rows.filter((item) => new Date(item.starts_at).getTime() >= now);
  }
  rows.sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
  return await Promise.all(rows.map((item) => getOfficial(item.id)));
}

export async function updateCheckByDiscord({ officialId, discordUserId, status }) {
  const player = await getPlayerByDiscordId(discordUserId);
  if (!player) {
    return { updated: false, reason: "player_not_linked" };
  }

  if (supabaseConfigured()) {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("official_players")
      .update({ check_status: status, checked_at: new Date().toISOString() })
      .eq("official_id", officialId)
      .eq("player_id", player.id)
      .select("*")
      .maybeSingle();
    if (error) throwSupabaseError(error, "actualizar el check");
    return {
      updated: Boolean(data),
      invitation: data || null,
      player,
      reason: data ? undefined : "not_invited"
    };
  }

  const store = await readLocalStore();
  const invitation = store.officialPlayers.find((item) => item.official_id === officialId && item.player_id === player.id);
  if (!invitation) {
    return { updated: false, reason: "not_invited", player };
  }
  invitation.check_status = status;
  invitation.checked_at = new Date().toISOString();
  await writeLocalStore(store);
  return { updated: true, invitation, player };
}

export async function listReminderCandidates() {
  const officials = await listOfficials({ upcomingOnly: true });
  return officials.filter((official) => official.status === "scheduled");
}

export async function markReminder(officialId, field) {
  const allowed = new Set(["reminder_24h_sent", "reminder_1h_sent", "check_open_sent"]);
  if (!allowed.has(field)) throw new Error("Campo de recordatorio no válido.");

  if (supabaseConfigured()) {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("officials")
      .update({ [field]: true })
      .eq("id", officialId);
    if (error) throwSupabaseError(error, "marcar el recordatorio");
    return;
  }

  const store = await readLocalStore();
  const official = store.officials.find((item) => item.id === officialId);
  if (official) official[field] = true;
  await writeLocalStore(store);
}

export async function saveReplayReport({ fileName, parsed, focus, ai }) {
  const report = {
    id: randomUUID(),
    filename: fileName,
    parsed_summary: parsed,
    focus_player: focus,
    ai_provider: ai.provider,
    ai_model: ai.model,
    ai_report: ai.text,
    created_at: new Date().toISOString()
  };

  if (supabaseConfigured()) {
    const supabase = createAdminClient();
    const { id: ignoredId, ...databaseReport } = report;
    const { data, error } = await supabase
      .from("replay_reports")
      .insert(databaseReport)
      .select("*")
      .single();
    if (error) throwSupabaseError(error, "guardar el análisis de la repetición");
    return data;
  }

  const store = await readLocalStore();
  store.replayReports.push(report);
  try {
    await writeLocalStore(store);
  } catch {
    // El análisis todavía se devuelve aunque Vercel no tenga base configurada.
  }
  return report;
}

export function databaseMode() {
  if (supabaseConfigured()) return "supabase-sdk";
  return process.env.VERCEL ? "missing-supabase" : "local-json";
}
