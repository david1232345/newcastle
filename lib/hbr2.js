import { inflateRawSync } from "node:zlib";

const decoder = new TextDecoder("utf-8", { fatal: true });
const looseDecoder = new TextDecoder("utf-8", { fatal: false });

const COUNTRY_CODES = new Set([
  "ar", "bo", "br", "ca", "cl", "co", "cr", "do", "ec", "es", "fr",
  "gb", "gt", "hn", "it", "mx", "ni", "pa", "pe", "pr", "py", "sv",
  "tr", "us", "uy", "ve", "de", "pt", "nl", "pl", "ru", "tv", "o_"
]);

const EXCLUDED_NAME_PARTS = [
  "hosting", "miami", "florida", "partido", "tiempo", "grabación", "grabacion",
  "repetición", "repeticion", "admin", "sistema", "auto-assigned", "límite",
  "limite", "marcador", "asistencia", "gol de", "recording", "game started"
];

function readUInt32BE(buffer, offset) {
  if (offset + 4 > buffer.length) {
    return 0;
  }
  return buffer.readUInt32BE(offset);
}

function formatDuration(totalSeconds) {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function countAlphaNumeric(value) {
  return [...value].filter((character) => /[\p{L}\p{N}]/u.test(character)).length;
}

function cleanString(value) {
  return value
    .replace(/[\u0000-\u001f\u007f\ufffd]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractLengthPrefixedStrings(buffer, options = {}) {
  const minimum = options.minimum ?? 2;
  const maximum = options.maximum ?? 128;
  const start = options.start ?? 0;
  const end = Math.min(options.end ?? buffer.length, buffer.length);
  const values = [];

  for (let offset = Math.max(0, start); offset + 5 <= end; offset += 1) {
    const length = readUInt32BE(buffer, offset);
    if (length < minimum || length > maximum || offset + 4 + length > end) {
      continue;
    }

    let bytes = buffer.subarray(offset + 4, offset + 4 + length);
    while (bytes.length && bytes[bytes.length - 1] === 0) {
      bytes = bytes.subarray(0, bytes.length - 1);
    }
    if (!bytes.length) {
      continue;
    }

    try {
      const value = cleanString(decoder.decode(bytes));
      if (!value || [...value].some((character) => !character.trim() && !/\s/u.test(character))) {
        continue;
      }
      values.push({ offset, length, value });
    } catch {
      continue;
    }
  }

  return values;
}

function extractRoomName(payload) {
  const head = looseDecoder.decode(payload.subarray(0, Math.min(payload.length, 1200)));
  const sequences = head.match(/[\p{L}\p{N}][\p{L}\p{N}\s#.,—–_\-]{5,80}/gu) ?? [];
  const candidate = sequences
    .map(cleanString)
    .find((value) => /hosting|hax|room|sala|server/i.test(value));
  return candidate || sequences.map(cleanString).find((value) => value.length >= 8) || "Sala de HaxBall";
}

function findMatchStartOffset(payload) {
  const needles = [
    "Partido Iniciado",
    "Game started",
    "Match started",
    "¡Partido Iniciado!"
  ];

  for (const needle of needles) {
    const index = payload.indexOf(Buffer.from(needle, "utf8"));
    if (index >= 0) {
      return index;
    }
  }

  return Math.min(payload.length, 60000);
}

function isLikelyPlayerName(value) {
  const normalized = cleanString(value);
  const lower = normalized.toLocaleLowerCase("es");

  if (normalized.length < 2 || normalized.length > 32) {
    return false;
  }
  if (COUNTRY_CODES.has(lower)) {
    return false;
  }
  if (EXCLUDED_NAME_PARTS.some((part) => lower.includes(part))) {
    return false;
  }
  if (normalized.startsWith("@") || normalized.startsWith("[") || normalized.startsWith("▶") || normalized.startsWith("✨")) {
    return false;
  }
  if (countAlphaNumeric(normalized) < 2) {
    return false;
  }
  if (/^[\d\W_]+$/u.test(normalized)) {
    return false;
  }
  if (/^\d{1,2}[a-z]{2}$/iu.test(normalized)) {
    return false;
  }
  if (/^[^\p{L}\p{N}]+[a-z]{2}$/iu.test(normalized)) {
    return false;
  }
  if (normalized.length === 2 && normalized[0].toLocaleLowerCase("es") === normalized[1].toLocaleLowerCase("es")) {
    return false;
  }
  if (normalized.length <= 5 && [...COUNTRY_CODES].some((code) => lower.endsWith(code) && lower !== code)) {
    return false;
  }

  return true;
}

function extractPlayers(payload) {
  const matchStart = findMatchStartOffset(payload);
  const start = Math.max(0, matchStart - 22000);
  const strings = extractLengthPrefixedStrings(payload, { start, end: matchStart, maximum: 64 });
  const players = new Map();

  for (const item of strings) {
    const name = cleanString(item.value);
    if (!isLikelyPlayerName(name)) {
      continue;
    }
    players.set(name.toLocaleLowerCase("es"), name);
  }

  return [...players.values()];
}

function extractGoals(text) {
  const goals = [];
  const spanish = /GOL de\s+([^!\0]+)!\s*Marcador:\s*([^\.\0]+)\.\s*Asistencia:\s*([^\.\0]+)\./giu;
  let match;
  while ((match = spanish.exec(text)) !== null) {
    goals.push({
      team: cleanString(match[1]).replace(/^[^\p{L}\p{N}]+/u, ""),
      scorer: cleanString(match[2]),
      assist: cleanString(match[3])
    });
  }

  const english = /GOAL for\s+([^!\0]+)!\s*Scorer:\s*([^\.\0]+)\.\s*Assist:\s*([^\.\0]+)\./giu;
  while ((match = english.exec(text)) !== null) {
    goals.push({
      team: cleanString(match[1]).replace(/^[^\p{L}\p{N}]+/u, ""),
      scorer: cleanString(match[2]),
      assist: cleanString(match[3])
    });
  }

  return goals;
}

function extractChat(text) {
  const messages = [];
  const pattern = /(?:\[[^\]\0]{0,24}\]\s*)?([^\[\]\0\n\r]{1,38})\s*\[(\d{1,6})\]:\s*([^\0\n\r]{1,220})/gu;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    const author = cleanString(match[1]).replace(/^Admin\]\s*/i, "").replace(/^️\s*/, "");
    const message = cleanString(match[3]);
    if (!isLikelyPlayerName(author) || !message) {
      continue;
    }
    messages.push({ author, id: match[2], message });
  }
  return messages;
}

function summarizePlayers(players, goals, chat) {
  const summary = new Map();
  const ensure = (name) => {
    const key = name.toLocaleLowerCase("es");
    if (!summary.has(key)) {
      summary.set(key, { name, goals: 0, assists: 0, chatMessages: 0 });
    }
    return summary.get(key);
  };

  players.forEach((name) => ensure(name));
  goals.forEach((goal) => {
    ensure(goal.scorer).goals += 1;
    if (goal.assist && !/^(sin|none|ninguna|no)$/i.test(goal.assist)) {
      ensure(goal.assist).assists += 1;
    }
  });
  chat.forEach((message) => {
    ensure(message.author).chatMessages += 1;
  });

  return [...summary.values()].sort((a, b) => {
    const aScore = a.goals * 5 + a.assists * 3 + a.chatMessages * 0.05;
    const bScore = b.goals * 5 + b.assists * 3 + b.chatMessages * 0.05;
    return bScore - aScore || a.name.localeCompare(b.name, "es");
  });
}

function scoreFromFilename(fileName) {
  const match = String(fileName || "").match(/(?:^|[_\s-])(\d{1,2})-(\d{1,2})(?:[_\s-]|\.)/);
  if (!match) {
    return null;
  }
  return { home: Number(match[1]), away: Number(match[2]), source: "filename" };
}

function scoreFromGoals(goals) {
  if (!goals.length) {
    return null;
  }
  const totals = new Map();
  goals.forEach((goal) => {
    const key = goal.team.toLocaleLowerCase("es");
    totals.set(key, (totals.get(key) || 0) + 1);
  });
  const teams = [...totals.entries()].map(([team, goalsCount]) => ({ team, goals: goalsCount }));
  return { teams, source: "events" };
}

export function parseHbr2(input, fileName = "replay.hbr2") {
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input);
  if (buffer.length < 13) {
    throw new Error("El archivo es demasiado pequeño para ser una repetición HBR2.");
  }
  if (buffer.subarray(0, 4).toString("ascii") !== "HBR2") {
    throw new Error("El archivo no comienza con la firma HBR2.");
  }

  const version = readUInt32BE(buffer, 4);
  const durationFrames = readUInt32BE(buffer, 8);
  let payload;
  try {
    payload = inflateRawSync(buffer.subarray(12));
  } catch (error) {
    throw new Error(`No se pudo descomprimir la repetición: ${error.message}`);
  }

  const text = looseDecoder.decode(payload);
  const players = extractPlayers(payload);
  const goals = extractGoals(text);
  const chat = extractChat(text);
  const playerStats = summarizePlayers(players, goals, chat);
  const durationSeconds = durationFrames / 60;
  const filenameScore = scoreFromFilename(fileName);
  const eventScore = scoreFromGoals(goals);

  return {
    format: "HBR2",
    version,
    fileName,
    compressedBytes: buffer.length,
    decompressedBytes: payload.length,
    durationFrames,
    durationSeconds: Math.round(durationSeconds * 100) / 100,
    durationLabel: formatDuration(durationSeconds),
    roomName: extractRoomName(payload),
    players,
    playerCount: players.length,
    goals,
    goalCount: goals.length,
    score: filenameScore || eventScore,
    chatMessages: chat.slice(0, 250),
    chatMessageCount: chat.length,
    playerStats,
    limitations: [
      "El lector incluido extrae metadatos, participantes, goles, asistencias y mensajes visibles.",
      "Todavía no calcula con precisión posesión, mapas de calor, pases completos ni posiciones cuadro por cuadro.",
      "Las recomendaciones de IA se limitan a los datos extraídos y no deben inventar acciones no presentes en la repetición."
    ]
  };
}

export function focusPlayerReport(parsed, requestedName) {
  const requested = cleanString(requestedName || "");
  if (!requested) {
    return null;
  }
  const normalized = requested.toLocaleLowerCase("es");
  const exact = parsed.playerStats.find((player) => player.name.toLocaleLowerCase("es") === normalized);
  const partial = parsed.playerStats.find((player) => player.name.toLocaleLowerCase("es").includes(normalized));
  const player = exact || partial;
  if (!player) {
    return {
      requestedName: requested,
      found: false,
      availablePlayers: parsed.players
    };
  }

  const messages = parsed.chatMessages.filter((message) => message.author.toLocaleLowerCase("es") === player.name.toLocaleLowerCase("es"));
  return {
    requestedName: requested,
    found: true,
    ...player,
    messages: messages.slice(0, 40)
  };
}
