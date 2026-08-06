import { listPlayers, upsertPlayer } from "../lib/db.js";
import { errorResponse, handleOptions, readJsonBody, requireAdmin, sendJson } from "../lib/http.js";

function publicPlayer(player) {
  return {
    id: player.id,
    nickname: player.nickname,
    discordLinked: Boolean(player.discord_user_id),
    discordLast4: player.discord_user_id ? String(player.discord_user_id).slice(-4) : null,
    dmOptIn: player.dm_opt_in !== false,
    active: player.active !== false
  };
}

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  try {
    if (req.method === "GET") {
      const players = await listPlayers();
      sendJson(res, 200, { ok: true, players: players.map(publicPlayer) });
      return;
    }

    if (req.method === "POST") {
      requireAdmin(req);
      const body = await readJsonBody(req);
      const nickname = String(body.nickname || "").trim();
      const discordUserId = String(body.discordUserId || "").trim();
      if (!nickname || !/^\d{15,22}$/.test(discordUserId)) {
        const error = new Error("Escribe un nickname y un ID de Discord válido.");
        error.statusCode = 400;
        throw error;
      }
      const player = await upsertPlayer({
        nickname,
        discordUserId,
        dmOptIn: body.dmOptIn !== false
      });
      sendJson(res, 201, { ok: true, player: publicPlayer(player) });
      return;
    }

    sendJson(res, 405, { ok: false, error: "Método no permitido." });
  } catch (error) {
    errorResponse(res, error);
  }
}
