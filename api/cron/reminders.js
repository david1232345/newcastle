import { listReminderCandidates, markReminder } from "../../lib/db.js";
import { sendOfficialDms } from "../../lib/discord.js";
import { errorResponse, sendJson } from "../../lib/http.js";

function authorized(req) {
  const secret = String(process.env.CRON_SECRET || "");
  if (!secret) return !process.env.VERCEL;
  return req.headers.authorization === `Bearer ${secret}`;
}

function chooseStage(official, now) {
  const start = new Date(official.starts_at).getTime();
  const checkOpen = new Date(official.check_opens_at).getTime();
  const untilStart = start - now;

  if (untilStart <= 0) return null;
  if (!official.check_open_sent && now >= checkOpen) {
    return { stage: "checkOpen", field: "check_open_sent" };
  }
  if (!official.reminder_1h_sent && untilStart <= 90 * 60 * 1000) {
    return { stage: "reminder1", field: "reminder_1h_sent" };
  }
  if (!official.reminder_24h_sent && untilStart <= 25 * 60 * 60 * 1000) {
    return { stage: "reminder24", field: "reminder_24h_sent" };
  }
  return null;
}

export default async function handler(req, res) {
  try {
    if (!authorized(req)) {
      sendJson(res, 401, { ok: false, error: "No autorizado." });
      return;
    }
    if (!process.env.DISCORD_BOT_TOKEN) {
      sendJson(res, 503, { ok: false, error: "DISCORD_BOT_TOKEN no está configurado." });
      return;
    }

    const now = Date.now();
    const officials = await listReminderCandidates();
    const runs = [];

    for (const official of officials) {
      const due = chooseStage(official, now);
      if (!due) continue;

      const eligibleInvitations = (official.invitations || []).filter((invitation) => {
        if (!invitation.player || invitation.player.dm_opt_in === false) return false;
        if (due.stage !== "checkOpen" && invitation.check_status === "unavailable") return false;
        return true;
      });

      const results = await sendOfficialDms({ ...official, invitations: eligibleInvitations }, due.stage);
      await markReminder(official.id, due.field);
      runs.push({ officialId: official.id, opponent: official.opponent, stage: due.stage, results });
    }

    sendJson(res, 200, { ok: true, processed: runs.length, runs });
  } catch (error) {
    errorResponse(res, error);
  }
}
