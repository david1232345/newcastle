import { readRawBody } from "../../lib/http.js";
import { interactionResponse, updateInteractionResponse, verifyDiscordSignature } from "../../lib/discord.js";
import { listOfficials, setDmOptIn, updateCheckByDiscord, upsertPlayer } from "../../lib/db.js";

export const config = { api: { bodyParser: false } };

function sendInteraction(res, payload, status = 200) {
  res.status(status).setHeader("Content-Type", "application/json").send(JSON.stringify(payload));
}

function getInteractionUser(interaction) {
  return interaction.member?.user || interaction.user || null;
}

function getSubcommand(data) {
  return data?.options?.find((option) => option.type === 1) || null;
}

function getOption(options, name) {
  return options?.find((option) => option.name === name)?.value;
}

function formatOfficial(official) {
  const timeZone = process.env.DEFAULT_TIMEZONE || "America/Monterrey";
  const date = new Intl.DateTimeFormat("es-MX", {
    timeZone,
    weekday: "long",
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  }).format(new Date(official.starts_at));
  const checks = (official.invitations || []).reduce((accumulator, invitation) => {
    const key = invitation.check_status || "pending";
    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {});
  return [
    `**Newcastle Team vs ${official.opponent}**`,
    `${official.competition} · ${date}`,
    `Check: ${checks.confirmed || 0} confirmados · ${checks.pending || 0} pendientes · ${checks.unavailable || 0} no disponibles`,
    official.notes ? `Nota: ${official.notes}` : ""
  ].filter(Boolean).join("\n");
}

async function handleCommand(interaction) {
  const user = getInteractionUser(interaction);
  if (!user) {
    return interactionResponse("No pude identificar tu cuenta de Discord.");
  }

  if (interaction.data.name === "avisos") {
    const subcommand = getSubcommand(interaction.data);
    if (subcommand?.name === "activar") {
      const nickname = String(getOption(subcommand.options, "nickname") || "").trim();
      if (!nickname) {
        return interactionResponse("Escribe tu nombre de HaxBall.");
      }
      await upsertPlayer({
        nickname,
        discordUserId: user.id,
        dmOptIn: true
      });
      return interactionResponse(`Avisos activados para **${nickname}**. Ya puedes recibir convocatorias por privado.`);
    }

    if (subcommand?.name === "desactivar") {
      const updated = await setDmOptIn(user.id, false);
      if (!updated) {
        return interactionResponse("Tu cuenta todavía no estaba vinculada. Usa `/avisos activar` para registrarte.");
      }
      return interactionResponse("Avisos privados desactivados.");
    }
  }

  if (interaction.data.name === "proximo") {
    const officials = await listOfficials({ upcomingOnly: true });
    if (!officials.length) {
      return interactionResponse("Todavía no hay un partido oficial programado.", { ephemeral: false });
    }
    return interactionResponse(formatOfficial(officials[0]), { ephemeral: false });
  }

  return interactionResponse("Comando no reconocido.");
}

async function handleComponent(interaction) {
  const customId = String(interaction.data?.custom_id || "");
  const match = customId.match(/^check:([0-9a-f-]{20,}):(confirmed|unavailable)$/i);
  if (!match) {
    return interactionResponse("Este botón ya no es válido.");
  }

  const user = getInteractionUser(interaction);
  if (!user) {
    return interactionResponse("No pude identificar tu cuenta.");
  }

  const result = await updateCheckByDiscord({
    officialId: match[1],
    discordUserId: user.id,
    status: match[2]
  });

  if (!result.updated) {
    if (result.reason === "player_not_linked") {
      return interactionResponse("Primero vincula tu cuenta con `/avisos activar nickname:TuNombre`.");
    }
    return interactionResponse("No apareces en esta convocatoria. Habla con el DT si crees que es un error.");
  }

  const message = match[2] === "confirmed"
    ? `✅ Check registrado para **${result.player.nickname}**.`
    : `❌ **${result.player.nickname}** indicó que no puede jugar.`;
  return updateInteractionResponse(message);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  try {
    const rawBody = await readRawBody(req, 1_000_000);
    const signature = req.headers["x-signature-ed25519"];
    const timestamp = req.headers["x-signature-timestamp"];
    const publicKey = process.env.DISCORD_PUBLIC_KEY;

    if (!verifyDiscordSignature({
      publicKeyHex: publicKey,
      signatureHex: signature,
      timestamp,
      rawBody
    })) {
      res.status(401).send("invalid request signature");
      return;
    }

    const interaction = JSON.parse(rawBody.toString("utf8"));
    if (interaction.type === 1) {
      sendInteraction(res, { type: 1 });
      return;
    }
    if (interaction.type === 2) {
      sendInteraction(res, await handleCommand(interaction));
      return;
    }
    if (interaction.type === 3) {
      sendInteraction(res, await handleComponent(interaction));
      return;
    }
    sendInteraction(res, interactionResponse("Tipo de interacción no compatible."));
  } catch (error) {
    console.error(error);
    sendInteraction(res, interactionResponse(`No se pudo completar la acción: ${error.message}`));
  }
}
