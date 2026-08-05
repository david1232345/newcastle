import { databaseMode } from "../lib/db.js";
import { handleOptions, sendJson } from "../lib/http.js";

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  sendJson(res, 200, {
    ok: true,
    service: "newcastle-team-bot-ai",
    database: databaseMode(),
    discordConfigured: Boolean(process.env.DISCORD_BOT_TOKEN && process.env.DISCORD_PUBLIC_KEY),
    groqConfigured: Boolean(process.env.GROQ_API_KEY),
    timestamp: new Date().toISOString()
  });
}
