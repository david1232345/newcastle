import { createPublicKey, verify } from "node:crypto";

const API_BASE = "https://discord.com/api/v10";

function requireBotToken() {
  const token = String(process.env.DISCORD_BOT_TOKEN || "").trim();
  if (!token) {
    const error = new Error("DISCORD_BOT_TOKEN no está configurado.");
    error.statusCode = 503;
    throw error;
  }
  return token;
}

async function discordRequest(path, options = {}) {
  const token = requireBotToken();
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bot ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  if (!response.ok) {
    const error = new Error(`Discord respondió ${response.status}: ${text.slice(0, 260)}`);
    error.statusCode = response.status;
    throw error;
  }
  return text ? JSON.parse(text) : null;
}

export function verifyDiscordSignature({ publicKeyHex, signatureHex, timestamp, rawBody }) {
  if (!publicKeyHex || !signatureHex || !timestamp) {
    return false;
  }
  try {
    const rawKey = Buffer.from(publicKeyHex, "hex");
    const spkiPrefix = Buffer.from("302a300506032b6570032100", "hex");
    const publicKey = createPublicKey({
      key: Buffer.concat([spkiPrefix, rawKey]),
      format: "der",
      type: "spki"
    });
    const message = Buffer.concat([Buffer.from(timestamp), Buffer.from(rawBody)]);
    return verify(null, message, publicKey, Buffer.from(signatureHex, "hex"));
  } catch {
    return false;
  }
}

export async function createDmChannel(discordUserId) {
  return await discordRequest("/users/@me/channels", {
    method: "POST",
    body: JSON.stringify({ recipient_id: String(discordUserId) })
  });
}

export async function sendChannelMessage(channelId, payload) {
  return await discordRequest(`/channels/${channelId}/messages`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

function formatOfficialDate(value) {
  const timeZone = process.env.DEFAULT_TIMEZONE || "America/Monterrey";
  const date = new Date(value);
  return new Intl.DateTimeFormat("es-MX", {
    timeZone,
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  }).format(date);
}

function stageText(stage) {
  const labels = {
    created: "Nueva convocatoria",
    reminder24: "Recordatorio: el partido es mañana",
    reminder1: "El partido comienza pronto",
    checkOpen: "El check ya está abierto"
  };
  return labels[stage] || "Partido oficial";
}

export function officialMessagePayload(official, stage = "created") {
  const checkEnabled = stage === "checkOpen" || new Date() >= new Date(official.check_opens_at);
  const color = stage === "checkOpen" ? 0xe0af45 : 0x36b2dc;
  const fields = [
    { name: "Rival", value: official.opponent || "Por confirmar", inline: true },
    { name: "Competencia", value: official.competition || "Liga", inline: true },
    { name: "Fecha", value: formatOfficialDate(official.starts_at), inline: false }
  ];
  if (official.notes) {
    fields.push({ name: "Nota del DT", value: official.notes.slice(0, 1000), inline: false });
  }
  const components = checkEnabled ? [{
    type: 1,
    components: [
      {
        type: 2,
        style: 3,
        label: "Dar check",
        custom_id: `check:${official.id}:confirmed`
      },
      {
        type: 2,
        style: 4,
        label: "No puedo jugar",
        custom_id: `check:${official.id}:unavailable`
      }
    ]
  }] : [];

  return {
    content: stage === "created"
      ? "Fuiste convocado para un partido de Newcastle Team."
      : undefined,
    embeds: [{
      title: stageText(stage),
      description: checkEnabled
        ? "Responde con uno de los botones para que el DT vea tu estado."
        : `El check abrirá el ${formatOfficialDate(official.check_opens_at)}.`,
      color,
      fields,
      footer: { text: "Newcastle Team · avisos automáticos" },
      timestamp: new Date().toISOString()
    }],
    components
  };
}

export async function sendOfficialDm(player, official, stage = "created") {
  if (!player?.discord_user_id || player.dm_opt_in === false) {
    return { ok: false, skipped: true, reason: "dm_opt_out_or_missing_id", playerId: player?.id };
  }
  try {
    const channel = await createDmChannel(player.discord_user_id);
    const message = await sendChannelMessage(channel.id, officialMessagePayload(official, stage));
    return { ok: true, playerId: player.id, discordUserId: player.discord_user_id, messageId: message.id };
  } catch (error) {
    return { ok: false, playerId: player.id, discordUserId: player.discord_user_id, error: error.message };
  }
}

export async function sendOfficialDms(official, stage = "created") {
  const results = [];
  for (const invitation of official.invitations || []) {
    const result = await sendOfficialDm(invitation.player, official, stage);
    results.push(result);
    await new Promise((resolve) => setTimeout(resolve, 220));
  }
  return results;
}

export function interactionResponse(content, options = {}) {
  return {
    type: 4,
    data: {
      content,
      flags: options.ephemeral === false ? 0 : 64,
      ...(options.components ? { components: options.components } : {})
    }
  };
}

export function updateInteractionResponse(content) {
  return {
    type: 7,
    data: {
      content,
      embeds: [],
      components: []
    }
  };
}

export async function registerGuildCommands({ applicationId, guildId }) {
  const commands = [
    {
      name: "avisos",
      description: "Activa o desactiva los avisos privados de Newcastle Team",
      options: [
        {
          type: 1,
          name: "activar",
          description: "Vincula tu cuenta para recibir convocatorias",
          options: [
            {
              type: 3,
              name: "nickname",
              description: "Tu nombre de HaxBall",
              required: true,
              max_length: 40
            }
          ]
        },
        {
          type: 1,
          name: "desactivar",
          description: "Deja de recibir avisos privados"
        }
      ]
    },
    {
      name: "proximo",
      description: "Muestra el próximo partido oficial de Newcastle Team"
    }
  ];

  return await discordRequest(`/applications/${applicationId}/guilds/${guildId}/commands`, {
    method: "PUT",
    body: JSON.stringify(commands)
  });
}
