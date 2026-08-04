import { createOfficial, listOfficials } from "../lib/db.js";
import { sendOfficialDms } from "../lib/discord.js";
import { errorResponse, handleOptions, readJsonBody, requireAdmin, sendJson } from "../lib/http.js";

function publicOfficial(official) {
  return {
    id: official.id,
    opponent: official.opponent,
    competition: official.competition,
    startsAt: official.starts_at,
    checkOpensAt: official.check_opens_at,
    notes: official.notes,
    status: official.status,
    createdAt: official.created_at,
    invitations: (official.invitations || []).map((invitation) => ({
      id: invitation.id,
      status: invitation.check_status,
      checkedAt: invitation.checked_at,
      player: invitation.player ? {
        id: invitation.player.id,
        nickname: invitation.player.nickname,
        dmOptIn: invitation.player.dm_opt_in !== false
      } : null
    }))
  };
}

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  try {
    if (req.method === "GET") {
      const officials = await listOfficials({ upcomingOnly: req.query?.all !== "1" });
      sendJson(res, 200, { ok: true, officials: officials.map(publicOfficial) });
      return;
    }

    if (req.method === "POST") {
      requireAdmin(req);
      const body = await readJsonBody(req);
      const startsAt = new Date(body.startsAt);
      const checkOpensAt = body.checkOpensAt ? new Date(body.checkOpensAt) : null;
      const playerIds = Array.isArray(body.playerIds) ? [...new Set(body.playerIds.map(String))] : [];

      if (!String(body.opponent || "").trim() || Number.isNaN(startsAt.getTime())) {
        const error = new Error("Falta el rival o la fecha del partido no es válida.");
        error.statusCode = 400;
        throw error;
      }
      if (!playerIds.length) {
        const error = new Error("Selecciona al menos un jugador convocado.");
        error.statusCode = 400;
        throw error;
      }
      if (checkOpensAt && checkOpensAt >= startsAt) {
        const error = new Error("El check debe abrir antes del partido.");
        error.statusCode = 400;
        throw error;
      }

      const official = await createOfficial({
        opponent: body.opponent,
        competition: body.competition,
        startsAt: startsAt.toISOString(),
        checkOpensAt: checkOpensAt?.toISOString(),
        notes: body.notes,
        playerIds,
        createdBy: "web-dashboard"
      });

      let notifications = [];
      let notificationWarning = null;
      if (process.env.DISCORD_BOT_TOKEN) {
        notifications = await sendOfficialDms(official, "created");
      } else {
        notificationWarning = "El oficial se guardó, pero DISCORD_BOT_TOKEN no está configurado.";
      }

      sendJson(res, 201, {
        ok: true,
        official: publicOfficial(official),
        notifications,
        warning: notificationWarning
      });
      return;
    }

    sendJson(res, 405, { ok: false, error: "Método no permitido." });
  } catch (error) {
    errorResponse(res, error);
  }
}
