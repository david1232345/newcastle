import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

const localFile = path.join(process.cwd(), "data", "local-store.json");

function supabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function supabaseHeaders(extra = {}) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    ...extra
  };
}

async function supabaseRequest(tableAndQuery, options = {}) {
  const base = String(process.env.SUPABASE_URL).replace(/\/$/, "");
  const response = await fetch(`${base}/rest/v1/${tableAndQuery}`, {
    ...options,
    headers: supabaseHeaders(options.headers)
  });
  const text = await response.text();
  if (!response.ok) {
    const error = new Error(`Supabase respondió ${response.status}: ${text.slice(0, 300)}`);
    error.statusCode = response.status;
    throw error;
  }
  return text ? JSON.parse(text) : null;
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
    return await supabaseRequest("players?select=*&order=nickname.asc");
  }
  const store = await readLocalStore();
  return store.players.sort((a, b) => a.nickname.localeCompare(b.nickname, "es"));
}

export async function getPlayerByDiscordId(discordUserId) {
  if (supabaseConfigured()) {
    const rows = await supabaseRequest(`players?discord_user_id=eq.${encodeURIComponent(discordUserId)}&select=*&limit=1`);
    return rows?.[0] || null;
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
    const rows = await supabaseRequest("players?on_conflict=discord_user_id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(payload)
    });
    return rows?.[0];
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
    const rows = await supabaseRequest(`players?id=eq.${player.id}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ dm_opt_in: Boolean(dmOptIn), updated_at: new Date().toISOString() })
    });
    return rows?.[0];
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
    check_opens_at: checkOpensAt ? new Date(checkOpensAt).toISOString() : new Date(new Date(startsAt).getTime() - 30 * 60 * 1000).toISOString(),
    notes: String(notes || "").trim(),
    status: "scheduled",
    created_by: createdBy || "web",
    reminder_24h_sent: false,
    reminder_1h_sent: false,
    check_open_sent: false,
    created_at: new Date().toISOString()
  };

  if (supabaseConfigured()) {
    const rows = await supabaseRequest("officials", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ ...official, id: undefined })
    });
    const saved = rows?.[0];
    if (playerIds?.length) {
      await supabaseRequest("official_players", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify(playerIds.map((playerId) => ({
          official_id: saved.id,
          player_id: playerId,
          check_status: "pending"
        })))
      });
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
    const officials = await supabaseRequest(`officials?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
    const official = officials?.[0];
    if (!official) return null;
    const invitations = await supabaseRequest(`official_players?official_id=eq.${encodeURIComponent(id)}&select=*,players(*)&order=created_at.asc`);
    return { ...official, invitations: (invitations || []).map((item) => ({ ...item, player: item.players })) };
  }
  const store = await readLocalStore();
  const official = store.officials.find((item) => item.id === id);
  if (!official) return null;
  const invitations = store.officialPlayers
    .filter((item) => item.official_id === id)
    .map((item) => ({ ...item, player: store.players.find((player) => player.id === item.player_id) || null }));
  return { ...official, invitations };
}

export async function listOfficials({ upcomingOnly = false } = {}) {
  if (supabaseConfigured()) {
    const filter = upcomingOnly ? `&starts_at=gte.${encodeURIComponent(new Date().toISOString())}` : "";
    const officials = await supabaseRequest(`officials?select=*&order=starts_at.asc${filter}`);
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
    const rows = await supabaseRequest(`official_players?official_id=eq.${encodeURIComponent(officialId)}&player_id=eq.${encodeURIComponent(player.id)}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ check_status: status, checked_at: new Date().toISOString() })
    });
    return { updated: Boolean(rows?.length), invitation: rows?.[0] || null, player };
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
    await supabaseRequest(`officials?id=eq.${encodeURIComponent(officialId)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ [field]: true })
    });
    return;
  }
  const store = await readLocalStore();
  const official = store.officials.find((item) => item.id === officialId);
  if (official) official[field] = true;
  await writeLocalStore(store);
}

export async function saveReplayReport({ fileName, parsed, focus, ai }) {
  const report = {
    id: randomUUID(), filename: fileName, parsed_summary: parsed,
    focus_player: focus, ai_provider: ai.provider, ai_model: ai.model,
    ai_report: ai.text, created_at: new Date().toISOString()
  };
  if (supabaseConfigured()) {
    const rows = await supabaseRequest("replay_reports", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ ...report, id: undefined })
    });
    return rows?.[0];
  }
  const store = await readLocalStore();
  store.replayReports.push(report);
  try { await writeLocalStore(store); } catch { /* analysis still returns on Vercel without DB */ }
  return report;
}

export function databaseMode() {
  if (supabaseConfigured()) return "supabase";
  return process.env.VERCEL ? "missing-supabase" : "local-json";
}
