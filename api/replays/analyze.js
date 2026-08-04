import { parseHbr2, focusPlayerReport } from "../../lib/hbr2.js";
import { createCoachingReport } from "../../lib/groq.js";
import { saveReplayReport } from "../../lib/db.js";
import { errorResponse, handleOptions, readJsonBody, sendJson } from "../../lib/http.js";

const MAX_BYTES = 3 * 1024 * 1024;

function compactParsed(parsed) {
  return {
    format: parsed.format,
    version: parsed.version,
    fileName: parsed.fileName,
    compressedBytes: parsed.compressedBytes,
    decompressedBytes: parsed.decompressedBytes,
    durationSeconds: parsed.durationSeconds,
    durationLabel: parsed.durationLabel,
    roomName: parsed.roomName,
    playerCount: parsed.playerCount,
    players: parsed.players,
    goalCount: parsed.goalCount,
    goals: parsed.goals,
    score: parsed.score,
    chatMessageCount: parsed.chatMessageCount,
    playerStats: parsed.playerStats,
    limitations: parsed.limitations
  };
}

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  if (req.method !== "POST") {
    sendJson(res, 405, { ok: false, error: "Método no permitido." });
    return;
  }

  try {
    const body = await readJsonBody(req, 4_400_000);
    const fileName = String(body.fileName || "replay.hbr2").slice(0, 160);
    const encoded = String(body.dataBase64 || "").replace(/^data:[^,]+,/, "");
    if (!encoded) {
      const error = new Error("No se recibió la repetición.");
      error.statusCode = 400;
      throw error;
    }

    const buffer = Buffer.from(encoded, "base64");
    if (!buffer.length || buffer.length > MAX_BYTES) {
      const error = new Error("La repetición debe pesar entre 1 byte y 3 MB.");
      error.statusCode = 413;
      throw error;
    }

    const parsed = parseHbr2(buffer, fileName);
    const focus = focusPlayerReport(parsed, body.playerName);
    const ai = await createCoachingReport(parsed, focus);
    const safeParsed = compactParsed(parsed);

    try {
      await saveReplayReport({ fileName, parsed: safeParsed, focus, ai });
    } catch {
      // El análisis no falla si la base de datos todavía no está configurada.
    }

    sendJson(res, 200, {
      ok: true,
      parsed: safeParsed,
      focus,
      ai
    });
  } catch (error) {
    errorResponse(res, error);
  }
}
