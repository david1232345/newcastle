import { readFile } from "node:fs/promises";
import { registerGuildCommands } from "../lib/discord.js";

async function loadLocalEnv() {
  try {
    const raw = await readFile(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const separator = trimmed.indexOf("=");
      if (separator < 1) continue;
      const key = trimmed.slice(0, separator).trim();
      const value = trimmed.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // Las variables también pueden venir directamente del sistema.
  }
}

await loadLocalEnv();

const applicationId = process.env.DISCORD_APPLICATION_ID;
const guildId = process.env.DISCORD_GUILD_ID;

if (!applicationId || !guildId || !process.env.DISCORD_BOT_TOKEN) {
  console.error("Faltan DISCORD_APPLICATION_ID, DISCORD_GUILD_ID o DISCORD_BOT_TOKEN.");
  process.exit(1);
}

const result = await registerGuildCommands({ applicationId, guildId });
console.log(`Comandos registrados: ${result.length}`);
for (const command of result) {
  console.log(`- /${command.name}`);
}
